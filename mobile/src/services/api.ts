import Constants from 'expo-constants';
import { Room, Booking, CreateBookingPayload, SlotAvailability } from '../types';
import { MOCK_ROOMS, STANDARD_TIME_SLOTS } from './mockData';
import { useBookingStore } from '../store/useBookingStore';

interface FetchRoomsParams {
  search?: string;
  building?: string;
  minCapacity?: number;
  roomType?: string;
}

// The Metro API is the only authority for confirmed bookings. Offline bookings
// stay pending until this server accepts them.
export const getApiBaseUrl = (): string => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.replace(/^https?:\/\//, '').split(':')[0];
    return `http://${host}:8081`;
  }
  return 'http://localhost:8081';
};

export const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeoutMs = 3000
): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const createBookingId = () => `b-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export const apiService = {
  async getRooms(params: FetchRoomsParams = {}): Promise<Room[]> {
    return MOCK_ROOMS.filter((room) =>
      (!params.search || [room.name, room.building, room.description]
        .some((value) => value.toLowerCase().includes(params.search!.toLowerCase()))) &&
      (!params.building || params.building === 'Tất cả' || room.building === params.building) &&
      (!params.minCapacity || room.capacity >= params.minCapacity) &&
      (!params.roomType || params.roomType === 'all' || room.room_type === params.roomType)
    );
  },

  async getRoomDetail(roomId: string, date: string): Promise<{
    room: Room;
    availableSlots: string[];
    bookedSlots: string[];
  }> {
    const room = MOCK_ROOMS.find((item) => item.id === roomId);
    if (!room) throw new Error('Không tìm thấy phòng học.');

    let serverSlots: string[] = [];
    try {
      const response = await fetchWithTimeout(
        `${getApiBaseUrl()}/api/rooms/${encodeURIComponent(roomId)}?date=${encodeURIComponent(date)}`,
        {}, 2000
      );
      if (response.ok) {
        const json = await response.json();
        serverSlots = json.data?.booked_slots || [];
      }
    } catch {
      // Show locally saved bookings while the server is unavailable.
    }

    const localSlots = useBookingStore.getState().localBookings
      .filter((booking) => booking.room_id === roomId && booking.booking_date === date &&
        booking.status === 'confirmed')
      .map((booking) => booking.time_slot);
    const bookedSlots = Array.from(new Set([...serverSlots, ...localSlots]));
    return {
      room,
      bookedSlots,
      availableSlots: STANDARD_TIME_SLOTS.filter((slot) => !bookedSlots.includes(slot)),
    };
  },

  async getSlotAvailability(roomId: string, date: string): Promise<SlotAvailability[]> {
    const { availableSlots } = await this.getRoomDetail(roomId, date);
    return STANDARD_TIME_SLOTS.map((slot) => ({ slot, is_available: availableSlots.includes(slot) }));
  },

  async getBookings(studentId?: string): Promise<Booking[]> {
    try {
      const url = studentId
        ? `${getApiBaseUrl()}/api/bookings?student_id=${encodeURIComponent(studentId)}`
        : `${getApiBaseUrl()}/api/bookings`;
      const response = await fetchWithTimeout(url, {}, 2000);
      if (!response.ok) throw new Error('Không thể tải lịch đặt phòng.');
      const json = await response.json();
      const serverBookings: Booking[] = json.data || [];
      const { localBookings, setLocalBookings } = useBookingStore.getState();
      const pending = localBookings.filter((booking) => booking.is_offline_pending);
      const merged = [...pending, ...serverBookings.filter((booking) =>
        !pending.some((item) => item.id === booking.id))];
      setLocalBookings(merged);
      return studentId
        ? merged.filter((booking) => booking.user_student_id.toUpperCase() === studentId.toUpperCase())
        : merged;
    } catch {
      const { localBookings } = useBookingStore.getState();
      return studentId
        ? localBookings.filter((booking) => booking.user_student_id.toUpperCase() === studentId.toUpperCase())
        : localBookings;
    }
  },

  async createBooking(payload: CreateBookingPayload): Promise<Booking> {
    const room = MOCK_ROOMS.find((item) => item.id === payload.room_id);
    if (!room || !STANDARD_TIME_SLOTS.includes(payload.time_slot)) {
      throw new Error('Phòng học hoặc ca học không hợp lệ.');
    }
    const { localBookings, addLocalBooking } = useBookingStore.getState();
    if (localBookings.some((booking) => booking.room_id === payload.room_id &&
      booking.booking_date === payload.booking_date && booking.time_slot === payload.time_slot &&
      booking.status === 'confirmed' && booking.is_offline_pending)) {
      throw new Error('Ca này đã có lịch đang chờ đồng bộ trên thiết bị.');
    }

    const clientId = createBookingId();
    const body = {
      ...payload,
      purpose: payload.purpose || 'Học tập / Nghiên cứu',
      client_id: clientId,
      room_name: room.name,
      building: room.building,
      capacity: room.capacity,
      image_url: room.image_url,
    };
    let response: Response;
    try {
      response = await fetchWithTimeout(`${getApiBaseUrl()}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }, 2500);
    } catch {
      const pending: Booking = {
        ...body,
        id: clientId,
        status: 'confirmed',
        created_at: new Date().toISOString(),
        is_offline_pending: true,
      };
      addLocalBooking(pending);
      return pending;
    }

    const json = await response.json();
    if (!response.ok || !json.success || !json.data) {
      throw new Error(json.error || 'Không thể đặt phòng. Vui lòng thử lại.');
    }
    const confirmed = { ...json.data, is_offline_pending: false } as Booking;
    addLocalBooking(confirmed);
    return confirmed;
  },

  async syncOfflineBookings(): Promise<{
    synced: Booking[];
    conflicts: { booking: Booking; message: string }[];
    error?: string;
  }> {
    const pending = useBookingStore.getState().localBookings.filter((booking) =>
      booking.is_offline_pending && booking.status === 'confirmed');
    const synced: Booking[] = [];
    const conflicts: { booking: Booking; message: string }[] = [];
    let error: string | undefined;

    for (const booking of pending) {
      try {
        const response = await fetchWithTimeout(`${getApiBaseUrl()}/api/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...booking, client_id: booking.id }),
        }, 3000);
        if (response.status === 409) {
          useBookingStore.getState().updateLocalBooking(booking.id, {
            status: 'cancelled', is_offline_pending: false,
          });
          conflicts.push({ booking, message: `Ca ${booking.time_slot} phòng ${booking.room_name} ngày ${booking.booking_date} đã bị đặt trước.` });
        } else if (response.ok) {
          useBookingStore.getState().updateLocalBooking(booking.id, { is_offline_pending: false });
          synced.push({ ...booking, is_offline_pending: false });
        } else {
          error = 'Máy chủ không thể đồng bộ một số lịch đặt phòng.';
        }
      } catch {
        error = 'Không thể kết nối máy chủ để đồng bộ lịch đặt phòng.';
      }
    }
    return { synced, conflicts, error };
  },

  async cancelBooking(bookingId: string): Promise<boolean> {
    const { localBookings, cancelLocalBooking } = useBookingStore.getState();
    const booking = localBookings.find((item) => item.id === bookingId);
    if (!booking) throw new Error('Không tìm thấy lịch đặt phòng.');
    if (booking.is_offline_pending) {
      cancelLocalBooking(bookingId);
      return true;
    }

    let response: Response;
    try {
      response = await fetchWithTimeout(
        `${getApiBaseUrl()}/api/bookings/${encodeURIComponent(bookingId)}`,
        { method: 'DELETE' }, 2500
      );
    } catch {
      throw new Error('Không kết nối được máy chủ. Lịch đặt phòng chưa được hủy.');
    }
    if (!response.ok) throw new Error('Máy chủ chưa xác nhận hủy lịch đặt phòng.');
    cancelLocalBooking(bookingId);
    return true;
  },
};

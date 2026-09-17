import { Room, Booking, CreateBookingPayload, SlotAvailability } from '../types';
import { MOCK_ROOMS, STANDARD_TIME_SLOTS } from './mockData';
import { useBookingStore } from '../store/useBookingStore';

interface FetchRoomsParams {
  search?: string;
  building?: string;
  minCapacity?: number;
  date?: string;
  slot?: string;
}

export const apiService = {
  // 1. Get Rooms
  async getRooms(params: FetchRoomsParams = {}): Promise<Room[]> {
    const { apiUrl, isOfflineMode } = useBookingStore.getState();

    if (apiUrl && !isOfflineMode) {
      try {
        const query = new URLSearchParams();
        if (params.search) query.append('search', params.search);
        if (params.building && params.building !== 'Tất cả') query.append('building', params.building);
        if (params.minCapacity) query.append('minCapacity', params.minCapacity.toString());
        if (params.date) query.append('date', params.date);
        if (params.slot) query.append('slot', params.slot);

        const res = await fetch(`${apiUrl}/api/rooms?${query.toString()}`);
        if (res.ok) {
          const json = await res.json();
          return json.data;
        }
      } catch (err) {
        console.warn('API fetch failed, falling back to local data:', err);
      }
    }

    // Local / Offline fallback
    let filtered = [...MOCK_ROOMS];

    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.building.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
      );
    }

    if (params.building && params.building !== 'Tất cả') {
      filtered = filtered.filter((r) => r.building === params.building);
    }

    if (params.minCapacity && params.minCapacity > 0) {
      filtered = filtered.filter((r) => r.capacity >= params.minCapacity!);
    }

    return filtered;
  },

  // 2. Get Room Detail & Available Slots
  async getRoomDetail(
    roomId: string,
    date: string
  ): Promise<{ room: Room; availableSlots: string[]; bookedSlots: string[] }> {
    const { apiUrl, isOfflineMode, localBookings } = useBookingStore.getState();

    if (apiUrl && !isOfflineMode) {
      try {
        const res = await fetch(`${apiUrl}/api/rooms/${roomId}?date=${date}`);
        if (res.ok) {
          const json = await res.json();
          return {
            room: json.data.room,
            availableSlots: json.data.available_slots,
            bookedSlots: json.data.booked_slots,
          };
        }
      } catch (err) {
        console.warn('API getRoomDetail failed, fallback to local:', err);
      }
    }

    const room = MOCK_ROOMS.find((r) => r.id === roomId) || MOCK_ROOMS[0];
    const activeBookings = localBookings.filter(
      (b) => b.room_id === roomId && b.booking_date === date && b.status === 'confirmed'
    );
    const bookedSlots = activeBookings.map((b) => b.time_slot);
    const availableSlots = STANDARD_TIME_SLOTS.filter((s) => !bookedSlots.includes(s));

    return {
      room,
      availableSlots,
      bookedSlots,
    };
  },

  // 3. Get Slot Availability Matrix
  async getSlotAvailability(roomId: string, date: string): Promise<SlotAvailability[]> {
    const { availableSlots } = await this.getRoomDetail(roomId, date);
    return STANDARD_TIME_SLOTS.map((slot) => ({
      slot,
      is_available: availableSlots.includes(slot),
    }));
  },

  // 4. Get User Bookings
  async getBookings(studentId?: string): Promise<Booking[]> {
    const { apiUrl, isOfflineMode, localBookings } = useBookingStore.getState();

    if (apiUrl && !isOfflineMode) {
      try {
        const url = studentId
          ? `${apiUrl}/api/bookings?student_id=${encodeURIComponent(studentId)}`
          : `${apiUrl}/api/bookings`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          return json.data;
        }
      } catch (err) {
        console.warn('API getBookings failed, fallback to local:', err);
      }
    }

    if (studentId) {
      return localBookings.filter((b) => b.user_student_id === studentId);
    }
    return localBookings;
  },

  // 5. Create Booking with Conflict Prevention
  async createBooking(payload: CreateBookingPayload): Promise<Booking> {
    const { apiUrl, isOfflineMode, localBookings, addLocalBooking } = useBookingStore.getState();

    if (apiUrl && !isOfflineMode) {
      try {
        const res = await fetch(`${apiUrl}/api/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || 'Lỗi khi đặt phòng từ máy chủ');
        }
        // Also sync into local state for immediate responsiveness
        addLocalBooking(json.data);
        return json.data;
      } catch (err: any) {
        // If it's a 409 conflict, propagate error directly
        if (err.message && err.message.includes('Xung đột')) {
          throw err;
        }
        console.warn('API createBooking failed, falling back to local booking check:', err);
      }
    }

    // Local Conflict Check (Chống trùng lịch cục bộ)
    const hasConflict = localBookings.some(
      (b) =>
        b.room_id === payload.room_id &&
        b.booking_date === payload.booking_date &&
        b.time_slot === payload.time_slot &&
        b.status === 'confirmed'
    );

    if (hasConflict) {
      throw new Error('Xung đột lịch: Khung giờ này đã có người đặt trước. Vui lòng chọn ca khác!');
    }

    const room = MOCK_ROOMS.find((r) => r.id === payload.room_id);
    const newBooking: Booking = {
      id: 'b-local-' + Date.now(),
      room_id: payload.room_id,
      user_name: payload.user_name,
      user_student_id: payload.user_student_id,
      booking_date: payload.booking_date,
      time_slot: payload.time_slot,
      purpose: payload.purpose || 'Học tập / Nghiên cứu',
      status: 'confirmed',
      created_at: new Date().toISOString(),
      room_name: room?.name || 'Phòng học VKU',
      building: room?.building || 'Tòa nhà A3',
      capacity: room?.capacity || 30,
      image_url: room?.image_url,
    };

    addLocalBooking(newBooking);
    return newBooking;
  },

  // 6. Cancel Booking
  async cancelBooking(bookingId: string): Promise<boolean> {
    const { apiUrl, isOfflineMode, cancelLocalBooking } = useBookingStore.getState();

    cancelLocalBooking(bookingId);

    if (apiUrl && !isOfflineMode) {
      try {
        await fetch(`${apiUrl}/api/bookings/${bookingId}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('Failed to delete on server:', err);
      }
    }

    return true;
  },
};

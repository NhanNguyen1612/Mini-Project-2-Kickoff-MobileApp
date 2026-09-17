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

/**
 * Service quản lý dữ liệu phòng học và đặt lịch (Slide 30, 32)
 * Sử dụng 24 phòng học thực tế tại VKU và xử lý logic chống trùng lịch (Conflict Prevention)
 */
export const apiService = {
  // 1. Lấy danh sách phòng học và lọc theo tìm kiếm, tòa nhà, sức chứa (Slide 17, 18, 30)
  async getRooms(params: FetchRoomsParams = {}): Promise<Room[]> {
    // Mô phỏng độ trễ mạng nhẹ để demo hiệu ứng ActivityIndicator loading
    await new Promise((resolve) => setTimeout(resolve, 200));

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

  // 2. Lấy thông tin chi tiết phòng & danh sách các ca học còn trống / đã được đặt (Slide 30)
  async getRoomDetail(
    roomId: string,
    date: string
  ): Promise<{ room: Room; availableSlots: string[]; bookedSlots: string[] }> {
    const { localBookings } = useBookingStore.getState();

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

  // 3. Ma trận ca học
  async getSlotAvailability(roomId: string, date: string): Promise<SlotAvailability[]> {
    const { availableSlots } = await this.getRoomDetail(roomId, date);
    return STANDARD_TIME_SLOTS.map((slot) => ({
      slot,
      is_available: availableSlots.includes(slot),
    }));
  },

  // 4. Lấy lịch đặt phòng của sinh viên (Tab My Bookings - Slide 29)
  async getBookings(studentId?: string): Promise<Booking[]> {
    const { localBookings } = useBookingStore.getState();
    if (studentId) {
      return localBookings.filter((b) => b.user_student_id === studentId);
    }
    return localBookings;
  },

  // 5. Đặt phòng mới với thuật toán Chống Trùng Lịch (Conflict Prevention - Slide 30)
  async createBooking(payload: CreateBookingPayload): Promise<Booking> {
    const { localBookings, addLocalBooking } = useBookingStore.getState();

    // Ràng buộc duy nhất: Một phòng vào một ngày và một ca học chỉ có 1 người đặt
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
      id: 'b-' + Date.now(),
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

  // 6. Hủy lịch đặt phòng
  async cancelBooking(bookingId: string): Promise<boolean> {
    const { cancelLocalBooking } = useBookingStore.getState();
    cancelLocalBooking(bookingId);
    return true;
  },
};

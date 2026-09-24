export type RoomType = 'computer_lab' | 'theory_room' | 'meeting_room' | 'study_space';

export interface Room {
  id: string;
  name: string;
  building: string;
  capacity: number;
  room_type: RoomType;
  amenities: string[];
  image_url: string;
  description: string;
  is_active: number;
  is_available_in_slot?: boolean;
}

export type BookingStatus = 'confirmed' | 'cancelled';

export interface Booking {
  id: string;
  room_id: string;
  user_name: string;
  user_student_id: string;
  booking_date: string; // YYYY-MM-DD
  time_slot: string;    // e.g. "07:30 - 09:30"
  purpose: string;
  status: BookingStatus;
  created_at: string;
  // Denormalized room info for quick display
  room_name?: string;
  building?: string;
  capacity?: number;
  image_url?: string;
  is_offline_pending?: boolean;
  cloud_id?: string;
}

export interface CreateBookingPayload {
  room_id: string;
  user_name: string;
  user_student_id: string;
  booking_date: string;
  time_slot: string;
  purpose?: string;
}

export interface SlotAvailability {
  slot: string;
  is_available: boolean;
  booked_by?: string;
}

export interface RoomFilterState {
  searchQuery: string;
  selectedBuilding: string;
  selectedCapacity: number; // 0 for all, or 20, 35, 50, etc.
  selectedRoomType: string; // 'all' hoặc 'computer_lab' | 'theory_room' | 'meeting_room' | 'study_space'
  selectedStatus: 'all' | 'available' | 'occupied';
  selectedDate: string; // YYYY-MM-DD
}

export interface UserProfile {
  studentId: string;
  fullName: string;
  email: string;
  department: string;
  password?: string;
}

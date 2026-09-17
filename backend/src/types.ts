export type RoomType = 'computer_lab' | 'theory_room' | 'meeting_room' | 'study_space';

export interface Room {
  id: string;
  name: string;
  building: string;
  capacity: number;
  room_type: RoomType;
  amenities: string[]; // parsed from JSON string in DB
  image_url: string;
  description: string;
  is_active: number;
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
}

export interface CreateBookingRequest {
  room_id: string;
  user_name: string;
  user_student_id: string;
  booking_date: string;
  time_slot: string;
  purpose?: string;
}

export interface Bindings {
  DB: D1Database;
}

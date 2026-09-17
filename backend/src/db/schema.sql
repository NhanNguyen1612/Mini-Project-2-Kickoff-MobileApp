-- VKU Room Booking Database Schema (Cloudflare D1 SQLite)

CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  building TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  room_type TEXT NOT NULL,
  amenities TEXT NOT NULL, -- JSON array string
  image_url TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_student_id TEXT NOT NULL,
  booking_date TEXT NOT NULL, -- YYYY-MM-DD
  time_slot TEXT NOT NULL,    -- e.g. "07:30 - 09:30"
  purpose TEXT DEFAULT '',
  status TEXT DEFAULT 'confirmed', -- 'confirmed', 'cancelled'
  created_at TEXT DEFAULT (datetime('now', '+7 hours'))
);

-- Index for searching and filtering rooms
CREATE INDEX IF NOT EXISTS idx_rooms_building ON rooms(building);
CREATE INDEX IF NOT EXISTS idx_rooms_capacity ON rooms(capacity);

-- Partial Unique Index for Conflict Prevention (Chống trùng lịch 100%)
-- Only one confirmed booking can exist for a specific room, date, and time slot!
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_booking 
ON bookings (room_id, booking_date, time_slot) 
WHERE status = 'confirmed';

-- Index for query user bookings
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_student_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_room_date ON bookings(room_id, booking_date);

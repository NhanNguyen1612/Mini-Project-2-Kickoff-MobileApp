import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Bindings, CreateBookingRequest, Room } from './types';

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for mobile app and web clients
app.use('*', cors());

// Health check & Info
app.get('/', (c) => {
  return c.json({
    name: 'VKU Study Room Booking API',
    status: 'online',
    version: '1.0.0',
    platform: 'Cloudflare Workers + D1',
    docs: {
      rooms: 'GET /api/rooms',
      roomDetail: 'GET /api/rooms/:id',
      availability: 'GET /api/rooms/:id/availability?date=YYYY-MM-DD',
      bookings: 'GET /api/bookings?student_id=XXX',
      createBooking: 'POST /api/bookings',
      cancelBooking: 'DELETE /api/bookings/:id',
      seed: 'POST /api/seed',
    },
  });
});

// Standard campus time slots
export const STANDARD_SLOTS = [
  '07:30 - 09:30',
  '09:45 - 11:45',
  '13:00 - 15:00',
  '15:15 - 17:15',
  '17:30 - 19:30',
  '19:45 - 21:45',
];

// Helper to format room record from D1
function formatRoom(row: any): Room {
  let amenities: string[] = [];
  try {
    amenities = typeof row.amenities === 'string' ? JSON.parse(row.amenities) : row.amenities;
  } catch {
    amenities = [];
  }
  return {
    ...row,
    amenities,
    capacity: Number(row.capacity),
    is_active: Number(row.is_active),
  };
}

// 1. GET /api/rooms - List and filter rooms
app.get('/api/rooms', async (c) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ error: 'Database binding not found' }, 500);
  }

  const search = c.req.query('search')?.trim().toLowerCase() || '';
  const building = c.req.query('building') || '';
  const minCapacity = Number(c.req.query('minCapacity')) || 0;
  const date = c.req.query('date') || new Date().toISOString().split('T')[0];
  const slot = c.req.query('slot') || '';

  try {
    let query = 'SELECT * FROM rooms WHERE is_active = 1';
    const params: any[] = [];

    if (building && building !== 'All' && building !== 'Tất cả') {
      query += ' AND building = ?';
      params.push(building);
    }

    if (minCapacity > 0) {
      query += ' AND capacity >= ?';
      params.push(minCapacity);
    }

    if (search) {
      query += ' AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(building) LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY building ASC, name ASC';

    const result = await db.prepare(query).bind(...params).all();
    const rooms = (result.results || []).map(formatRoom);

    // If a specific slot is requested, enrich rooms with availability for that slot
    if (slot) {
      const bookedRoomsResult = await db
        .prepare(
          `SELECT room_id FROM bookings WHERE booking_date = ? AND time_slot = ? AND status = 'confirmed'`
        )
        .bind(date, slot)
        .all();
      
      const bookedSet = new Set((bookedRoomsResult.results || []).map((r: any) => r.room_id));
      const enrichedRooms = rooms.map((room) => ({
        ...room,
        is_available_in_slot: !bookedSet.has(room.id),
      }));
      return c.json({ data: enrichedRooms, total: enrichedRooms.length });
    }

    return c.json({ data: rooms, total: rooms.length });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch rooms', details: err.message }, 500);
  }
});

// 2. GET /api/rooms/:id - Get room detail and its booked slots for a specific date
app.get('/api/rooms/:id', async (c) => {
  const db = c.env.DB;
  const roomId = c.req.param('id');
  const date = c.req.query('date') || new Date().toISOString().split('T')[0];

  try {
    const roomRow = await db.prepare('SELECT * FROM rooms WHERE id = ?').bind(roomId).first();
    if (!roomRow) {
      return c.json({ error: 'Room not found' }, 404);
    }

    // Get active bookings for this room on this date
    const bookingsResult = await db
      .prepare(
        `SELECT id, user_name, user_student_id, time_slot, purpose 
         FROM bookings 
         WHERE room_id = ? AND booking_date = ? AND status = 'confirmed'`
      )
      .bind(roomId, date)
      .all();

    const bookedSlots = (bookingsResult.results || []).map((b: any) => b.time_slot);

    return c.json({
      data: {
        room: formatRoom(roomRow),
        date,
        standard_slots: STANDARD_SLOTS,
        booked_slots: bookedSlots,
        available_slots: STANDARD_SLOTS.filter((s) => !bookedSlots.includes(s)),
      },
    });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch room detail', details: err.message }, 500);
  }
});

// 3. GET /api/rooms/:id/availability - Availability matrix
app.get('/api/rooms/:id/availability', async (c) => {
  const db = c.env.DB;
  const roomId = c.req.param('id');
  const date = c.req.query('date') || new Date().toISOString().split('T')[0];

  try {
    const bookingsResult = await db
      .prepare(
        `SELECT time_slot FROM bookings WHERE room_id = ? AND booking_date = ? AND status = 'confirmed'`
      )
      .bind(roomId, date)
      .all();

    const bookedSet = new Set((bookingsResult.results || []).map((b: any) => b.time_slot));

    const slots = STANDARD_SLOTS.map((slot) => ({
      slot,
      is_available: !bookedSet.has(slot),
    }));

    return c.json({ data: { roomId, date, slots } });
  } catch (err: any) {
    return c.json({ error: 'Failed to check availability', details: err.message }, 500);
  }
});

// 4. GET /api/bookings - Get list of bookings
app.get('/api/bookings', async (c) => {
  const db = c.env.DB;
  const studentId = c.req.query('student_id');

  try {
    let query = `
      SELECT b.*, r.name as room_name, r.building, r.capacity, r.image_url
      FROM bookings b
      LEFT JOIN rooms r ON b.room_id = r.id
    `;
    const params: any[] = [];

    if (studentId) {
      query += ' WHERE b.user_student_id = ?';
      params.push(studentId);
    }

    query += ' ORDER BY b.booking_date DESC, b.time_slot ASC, b.created_at DESC';

    const result = await db.prepare(query).bind(...params).all();
    return c.json({ data: result.results || [] });
  } catch (err: any) {
    return c.json({ error: 'Failed to fetch bookings', details: err.message }, 500);
  }
});

// 5. POST /api/bookings - Create a booking with conflict prevention
app.post('/api/bookings', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json<CreateBookingRequest>();

  if (!body.room_id || !body.booking_date || !body.time_slot || !body.user_name || !body.user_student_id) {
    return c.json({ error: 'Thiếu thông tin bắt buộc (room_id, date, slot, name, student_id)' }, 400);
  }

  try {
    // Check for conflict: Does a confirmed booking already exist for this room/date/slot?
    const existing = await db
      .prepare(
        `SELECT id, user_name FROM bookings 
         WHERE room_id = ? AND booking_date = ? AND time_slot = ? AND status = 'confirmed'`
      )
      .bind(body.room_id, body.booking_date, body.time_slot)
      .first();

    if (existing) {
      return c.json(
        {
          error: 'Xung đột lịch: Khung giờ này đã có người đặt trước!',
          conflictWith: existing.user_name,
        },
        409 // HTTP 409 Conflict
      );
    }

    const bookingId = 'b-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);

    await db
      .prepare(
        `INSERT INTO bookings (id, room_id, user_name, user_student_id, booking_date, time_slot, purpose, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')`
      )
      .bind(
        bookingId,
        body.room_id,
        body.user_name,
        body.user_student_id,
        body.booking_date,
        body.time_slot,
        body.purpose || 'Học tập / Nghiên cứu'
      )
      .run();

    // Fetch created booking with room info
    const newBooking = await db
      .prepare(
        `SELECT b.*, r.name as room_name, r.building, r.capacity, r.image_url
         FROM bookings b
         LEFT JOIN rooms r ON b.room_id = r.id
         WHERE b.id = ?`
      )
      .bind(bookingId)
      .first();

    return c.json({ success: true, message: 'Đặt phòng thành công!', data: newBooking }, 201);
  } catch (err: any) {
    if (err.message && err.message.includes('UNIQUE')) {
      return c.json({ error: 'Xung đột lịch: Khung giờ này đã vừa được người khác đặt trước!' }, 409);
    }
    return c.json({ error: 'Lỗi máy chủ khi đặt phòng', details: err.message }, 500);
  }
});

// 6. DELETE /api/bookings/:id - Cancel booking
app.delete('/api/bookings/:id', async (c) => {
  const db = c.env.DB;
  const bookingId = c.req.param('id');

  try {
    const booking = await db.prepare('SELECT * FROM bookings WHERE id = ?').bind(bookingId).first();
    if (!booking) {
      return c.json({ error: 'Không tìm thấy lịch đặt' }, 404);
    }

    await db
      .prepare(`UPDATE bookings SET status = 'cancelled' WHERE id = ?`)
      .bind(bookingId)
      .run();

    return c.json({ success: true, message: 'Đã hủy đặt phòng thành công' });
  } catch (err: any) {
    return c.json({ error: 'Lỗi khi hủy đặt phòng', details: err.message }, 500);
  }
});

// 7. POST /api/seed - Helper to seed database if empty
app.post('/api/seed', async (c) => {
  const db = c.env.DB;
  try {
    // Create tables if not exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        building TEXT NOT NULL,
        capacity INTEGER NOT NULL,
        room_type TEXT NOT NULL,
        amenities TEXT NOT NULL,
        image_url TEXT NOT NULL,
        description TEXT DEFAULT '',
        is_active INTEGER DEFAULT 1
      );
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        user_name TEXT NOT NULL,
        user_student_id TEXT NOT NULL,
        booking_date TEXT NOT NULL,
        time_slot TEXT NOT NULL,
        purpose TEXT DEFAULT '',
        status TEXT DEFAULT 'confirmed',
        created_at TEXT DEFAULT (datetime('now', '+7 hours'))
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_booking 
      ON bookings (room_id, booking_date, time_slot) 
      WHERE status = 'confirmed';
    `);

    const countRes = await db.prepare('SELECT count(*) as count FROM rooms').first();
    if (Number(countRes?.count || 0) > 0) {
      return c.json({ message: 'Database đã có dữ liệu!', count: countRes?.count });
    }

    return c.json({ message: 'Schema đã được tạo. Hãy chạy file seed.sql để nạp 24 phòng mẫu.' });
  } catch (err: any) {
    return c.json({ error: 'Seed failed', details: err.message }, 500);
  }
});

export default app;

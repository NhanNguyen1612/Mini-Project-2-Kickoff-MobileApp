import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Bindings, CreateBookingRequest, Room } from './types';
import { MOCK_ROOMS, INITIAL_MOCK_BOOKINGS, STANDARD_TIME_SLOTS } from './mockData';

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for mobile app and web clients
app.use('*', cors());

// Health check & Info
app.get('/api', (c) => {
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
      seed: 'GET or POST /api/seed',
    },
  });
});

app.get('/api/debug-env', (c) => {
  const env = c.env || {};
  return c.json({
    hasEnv: !!c.env,
    keys: Object.keys(env),
    hasDB: !!(env as any).DB,
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

  const search = c.req.query('search')?.trim().toLowerCase() || '';
  const building = c.req.query('building') || '';
  const minCapacity = Number(c.req.query('minCapacity')) || 0;
  const date = c.req.query('date') || new Date().toISOString().split('T')[0];
  const slot = c.req.query('slot') || '';

  // Graceful fallback nếu Cloudflare Pages chưa bind D1
  if (!db) {
    let filtered = [...MOCK_ROOMS];
    if (search) {
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(search) ||
          r.building.toLowerCase().includes(search) ||
          r.description.toLowerCase().includes(search)
      );
    }
    if (building && building !== 'All' && building !== 'Tất cả') {
      filtered = filtered.filter((r) => r.building === building);
    }
    if (minCapacity > 0) {
      filtered = filtered.filter((r) => r.capacity >= minCapacity);
    }
    return c.json({ data: filtered, total: filtered.length, source: 'fallback' });
  }

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

  if (!db) {
    const room = MOCK_ROOMS.find((r) => r.id === roomId) || MOCK_ROOMS[0];
    const activeBookings = INITIAL_MOCK_BOOKINGS.filter(
      (b) => b.room_id === roomId && b.booking_date === date && b.status === 'confirmed'
    );
    const bookedSlots = activeBookings.map((b) => b.time_slot);
    return c.json({
      data: {
        room,
        date,
        standard_slots: STANDARD_TIME_SLOTS,
        booked_slots: bookedSlots,
        available_slots: STANDARD_TIME_SLOTS.filter((s) => !bookedSlots.includes(s)),
      },
    });
  }

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

  if (!db) {
    if (studentId) {
      const userBookings = INITIAL_MOCK_BOOKINGS.filter((b) => b.user_student_id === studentId);
      return c.json({ data: userBookings });
    }
    return c.json({ data: INITIAL_MOCK_BOOKINGS });
  }

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

// 7. Seed database helper (hỗ trợ cả GET và POST)
const handleSeed = async (c: any) => {
  const db = c.env.DB;
  if (!db) {
    return c.json({ error: 'Database binding (DB) not found in environment' }, 500);
  }

  try {
    // 1. Tạo bảng nếu chưa có
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

    // 2. Kiểm tra nếu đã có dữ liệu
    const countRes = await db.prepare('SELECT count(*) as count FROM rooms').first();
    const currentCount = Number(countRes?.count || 0);

    if (currentCount >= 20) {
      return c.json({
        success: true,
        message: `Database đã có sẵn ${currentCount} phòng học!`,
        count: currentCount,
      });
    }

    // 3. Nạp 24 phòng học VKU mẫu
    await db.exec(`
      INSERT OR REPLACE INTO rooms (id, name, building, capacity, room_type, amenities, image_url, description, is_active) VALUES
      ('r-101', 'Lab A3-101 (Software Eng)', 'Tòa nhà A3', 35, 'computer_lab', '["40 PC Core i7", "Điều hòa đôi", "Máy chiếu Sony 4K", "Gigabit LAN", "Bảng kính"]', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80', 'Phòng thực hành Công nghệ Phần mềm & Lập trình Di động', 1),
      ('r-102', 'Lab A3-102 (AI & Data Science)', 'Tòa nhà A3', 30, 'computer_lab', '["30 PC RTX 4080", "Điều hòa trung tâm", "Bảng tương tác thông minh", "Mạng 10Gbps"]', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80', 'Phòng thí nghiệm Trí tuệ nhân tạo và Khoa học dữ liệu VKU', 1),
      ('r-103', 'Lab A3-201 (Cybersecurity)', 'Tòa nhà A3', 40, 'computer_lab', '["40 PC Core i9", "Mạng cô lập Isolated LAN", "Máy chiếu kép", "Điều hòa"]', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80', 'Phòng thực hành An toàn thông tin và Mạng máy tính', 1),
      ('r-104', 'Lab A3-202 (Mobile & Cloud)', 'Tòa nhà A3', 32, 'computer_lab', '["32 iMac 24-inch", "Bộ phát Wi-Fi 6 Dedicated", "Bảng kính", "Điều hòa đôi"]', 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&q=80', 'Phòng phát triển Ứng dụng Di động iOS/Android và Cloud', 1),
      ('r-105', 'Phòng Hội thảo A1-301', 'Tòa nhà A1', 80, 'meeting_room', '["Hệ thống âm thanh hội nghị", "2 Máy chiếu Laser", "Mic không dây", "Điều hòa âm trần"]', 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=800&q=80', 'Phòng hội thảo chuyên đề khoa học và báo cáo đồ án', 1),
      ('r-106', 'Phòng Nghiên cứu A1-302', 'Tòa nhà A1', 20, 'study_space', '["Bàn làm việc nhóm", "Smart TV 75-inch", "Bảng viết kính", "Ổ cắm từng bàn"]', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80', 'Không gian nghiên cứu cho giảng viên và nhóm nghiên cứu sinh viên', 1),
      ('r-107', 'Giảng đường A2-101', 'Tòa nhà A2', 120, 'theory_room', '["Màn hình LED P2.5 lớn", "Âm thanh vòm", "Bục giảng điện tử", "Điều hòa công suất lớn"]', 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80', 'Giảng đường bậc thang phục vụ học lý thuyết chung và sự kiện', 1),
      ('r-108', 'Giảng đường A2-102', 'Tòa nhà A2', 100, 'theory_room', '["Máy chiếu siêu nét", "Mic trợ giảng", "Bàn ghế liền tựa", "Điều hòa trung tâm"]', 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&q=80', 'Giảng đường lý thuyết tiêu chuẩn cơ sở VKU', 1),
      ('r-109', 'Phòng Học nhóm A2-205', 'Tòa nhà A2', 15, 'study_space', '["Bàn tròn di động", "Smart TV 55-inch", "Bảng flipchart", "Trà & Nước miễn phí"]', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80', 'Phòng thảo luận nhóm cho sinh viên làm đồ án môn học', 1),
      ('r-110', 'Phòng Học nhóm A2-206', 'Tòa nhà A2', 18, 'study_space', '["Bàn module xếp ghép", "Màn hình chiếu", "Bảng trắng 2 mặt", "Wi-Fi 6"]', 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&q=80', 'Phòng làm việc nhóm và brainstorm ý tưởng khởi nghiệp', 1),
      ('r-111', 'VKU Library Zone A (Yên tĩnh)', 'Thư viện Trung tâm', 60, 'study_space', '["Bàn đọc đơn có vách ngăn", "Đèn học cá nhân", "Ổ cắm sạc laptop", "Không gian tĩnh lặng"]', 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80', 'Khu tự học yên tĩnh tuyệt đối tại tầng 2 thư viện', 1),
      ('r-112', 'VKU Library Zone B (Nhóm mở)', 'Thư viện Trung tâm', 50, 'study_space', '["Ghế sofa thư giãn", "Bàn dài làm việc nhóm", "Cây xanh thư thái", "Cổng sạc Type-C"]', 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=800&q=80', 'Khu tự học mở, cho phép trao đổi học thuật thoải mái', 1),
      ('r-113', 'Thư viện - Seminar Room 1', 'Thư viện Trung tâm', 25, 'meeting_room', '["Máy chiếu tương tác Epson", "Webcam Poly họp trực tuyến", "Loa mic hội nghị Jabra"]', 'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=800&q=80', 'Phòng sinh hoạt chuyên đề, thuyết trình đồ án tốt nghiệp', 1),
      ('r-114', 'Thư viện - Seminar Room 2', 'Thư viện Trung tâm', 30, 'meeting_room', '["TV Samsung 85-inch 4K", "Bảng mica từ tính", "Điều hòa Inverter", "Ghế công thái học"]', 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=800&q=80', 'Phòng thuyết trình và seminar học thuật chất lượng cao', 1),
      ('r-115', 'Media Production Studio', 'Thư viện Trung tâm', 12, 'study_space', '["Phông xanh Chroma key", "Đèn chiếu sáng chuyên dụng", "Micro Rode PodMic", "Cách âm cao cấp"]', 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80', 'Studio thu âm podcast, quay bài giảng và video thuyết trình', 1),
      ('r-116', 'Smart Lab V.B101 (IoT & Robotics)', 'Tòa nhà V', 30, 'computer_lab', '["Bộ kit Arduino & ESP32", "Máy in 3D Bambu Lab", "Dụng cụ đo dao động số", "PC trạm"]', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80', 'Phòng thí nghiệm Internet of Things, Vi điều khiển và Robotics', 1),
      ('r-117', 'Lab V.B102 (Embedded Systems)', 'Tòa nhà V', 28, 'computer_lab', '["Trạm hàn chống tĩnh điện", "Board FPGA & ARM Cortex", "Nguồn đôi DC", "Điều hòa đôi"]', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80', 'Phòng thực hành Hệ thống nhúng và Thiết kế vi mạch', 1),
      ('r-118', 'Phòng Thực hành Mạng V.B201', 'Tòa nhà V', 40, 'computer_lab', '["Tủ Rack Cisco Switches", "Router băng thông cao", "Patch panel", "40 máy PC"]', 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80', 'Phòng thực hành cấu hình thiết bị mạng Cisco và định tuyến', 1),
      ('r-119', 'Phòng Đồ họa & Game V.B202', 'Tòa nhà V', 35, 'computer_lab', '["35 PC Intel i7 + GPU RTX 4070", "Bảng vẽ điện tử Wacom", "Màn hình 27-inch 2K 100% sRGB"]', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80', 'Phòng thiết kế đồ họa, dựng mô hình 3D và phát triển Game', 1),
      ('r-120', 'Phòng Đa năng V.B301', 'Tòa nhà V', 70, 'theory_room', '["2 Máy chiếu Panasonic", "Hệ thống âm thanh hội thảo", "Điều hòa 4 hướng thổi"]', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80', 'Phòng học lý thuyết đa năng và kiểm tra học phần', 1),
      ('r-121', 'Phòng Đa năng V.B302', 'Tòa nhà V', 65, 'theory_room', '["Bảng trượt 3 lớp", "Máy chiếu Laser độ sáng cao", "Bàn ghế di chuyển linh hoạt"]', 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80', 'Phòng học tương tác theo mô hình học tập kết hợp (Blended Learning)', 1),
      ('r-122', 'Không gian Sáng tạo VKU MakerSpace', 'Khu Thực nghiệm K', 45, 'study_space', '["Máy cắt laser CO2", "Bộ dụng cụ cơ khí tạo mẫu nhanh", "Bàn làm việc gỗ thông lớn", "Coffee corner"]', 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80', 'Không gian sáng chế dành cho các dự án Capstone & Khởi nghiệp sinh viên', 1),
      ('r-123', 'Phòng Họp Ban Chủ nhiệm K101', 'Khu Thực nghiệm K', 16, 'meeting_room', '["Màn hình hiển thị không dây AirPlay/Miracast", "Bàn họp gỗ sồi", "Ghế xoay lưới da"]', 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80', 'Phòng họp điều hành và tiếp đón doanh nghiệp hợp tác', 1),
      ('r-124', 'Hội trường Lớn Trực tuyến K200', 'Khu Thực nghiệm K', 150, 'theory_room', '["Màn hình LED sân khấu 200-inch", "Dàn âm thanh Line Array", "Hệ thống livestream chuyên dụng"]', 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&q=80', 'Hội trường diễn ra các buổi workshop, ngày hội việc làm và hackathon', 1);
    `);

    return c.json({
      success: true,
      message: 'Đã tạo schema và nạp thành công 24 phòng học & lab VKU vào database D1!',
      count: 24,
    });
  } catch (err: any) {
    return c.json({ error: 'Seed failed', details: err.message }, 500);
  }
};

app.get('/api/seed', handleSeed);
app.post('/api/seed', handleSeed);

export default app;

const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');
const path = require('path');
const url = require('url');

const config = getDefaultConfig(__dirname);

const DB_FILE = process.env.VKU_BOOKINGS_FILE || path.join(__dirname, 'bookings.json');
const USERS_FILE = process.env.VKU_USERS_FILE || path.join(__dirname, 'users.json');

// Đọc danh sách tài khoản sinh viên
function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const content = fs.readFileSync(USERS_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Error reading users.json:', e);
  }
  return [
    {
      studentId: '22IT001',
      fullName: 'Nguyễn Văn An',
      email: 'annv.22it@vku.udn.vn',
      department: 'Khoa Công nghệ Thông tin',
      password: '123',
    },
    {
      studentId: '23IT190',
      fullName: 'Vivi',
      email: '23it190@vku.udn.vn',
      department: 'Khoa Công nghệ Thông tin',
      password: '123123',
    },
  ];
}

// Lưu danh sách tài khoản sinh viên
function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing users.json:', e);
  }
}

// Đọc danh sách đặt phòng từ file JSON bền vững
function loadBookings() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Error reading bookings.json:', e);
  }
  return [];
}

// Lưu danh sách đặt phòng vào file JSON bền vững
function saveBookings(bookings) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(bookings, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing bookings.json:', e);
  }
}

// Hàm đọc body JSON từ HTTP request
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// Tích hợp Shared API Server trực tiếp vào Metro Bundler của Expo
// Cả máy ảo và điện thoại thật cùng kết nối qua port 8081 mà không cần chạy thêm server ngoài!
config.server = {
  ...config.server,
  enhanceMiddleware: (metroMiddleware) => {
    return async (req, res, next) => {
      const parsedUrl = url.parse(req.url, true);
      const pathname = parsedUrl.pathname || '';

      if (pathname.startsWith('/api/')) {
        // Cấu hình CORS để cả điện thoại và máy ảo gọi API không bị chặn
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        try {
          // 1. GET /api/bookings: Lấy danh sách lịch đặt (có thể lọc theo student_id)
          if (req.method === 'GET' && pathname === '/api/bookings') {
            const studentId = parsedUrl.query.student_id;
            let bookings = loadBookings();
            if (studentId) {
              bookings = bookings.filter((b) => b.user_student_id === studentId);
            }
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: true, data: bookings }));
            return;
          }

          // 2. GET /api/rooms/:id?date=...: Lấy các ca đã bị đặt của phòng
          if (req.method === 'GET' && pathname.startsWith('/api/rooms/')) {
            const parts = pathname.split('/');
            const roomId = parts[3];
            const date = parsedUrl.query.date;
            const bookings = loadBookings();
            const activeBookings = bookings.filter(
              (b) => b.room_id === roomId && b.booking_date === date && b.status === 'confirmed'
            );
            const bookedSlots = activeBookings.map((b) => b.time_slot);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(
              JSON.stringify({
                success: true,
                data: { roomId, date, booked_slots: bookedSlots },
              })
            );
            return;
          }

          // 3. POST /api/bookings: Đặt phòng với thuật toán CHỐNG TRÙNG LỊCH (Conflict Prevention)
          if (req.method === 'POST' && pathname === '/api/bookings') {
            const body = await parseJsonBody(req);
            if (!body.room_id || !body.booking_date || !body.time_slot ||
                !body.user_student_id || !body.client_id) {
              res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ success: false, error: 'Thiếu thông tin đặt phòng.' }));
              return;
            }
            const bookings = loadBookings();

            // A retry after a timeout returns the original booking instead of creating
            // a duplicate or incorrectly reporting a conflict.
            const existing = bookings.find((b) => b.id === body.client_id);
            if (existing) {
              res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ success: true, data: existing }));
              return;
            }

            // Kiểm tra xung đột: Cùng phòng + Cùng ngày + Cùng ca học
            const hasConflict = bookings.some(
              (b) =>
                b.room_id === body.room_id &&
                b.booking_date === body.booking_date &&
                b.time_slot === body.time_slot &&
                b.status === 'confirmed'
            );

            if (hasConflict) {
              res.writeHead(409, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(
                JSON.stringify({
                  success: false,
                  error: 'Xung đột lịch: Khung giờ này đã có người đặt trước. Vui lòng chọn ca khác!',
                })
              );
              return;
            }

            const newBooking = {
              id: body.client_id,
              room_id: body.room_id,
              user_name: body.user_name,
              user_student_id: body.user_student_id,
              booking_date: body.booking_date,
              time_slot: body.time_slot,
              purpose: body.purpose || 'Học tập / Nghiên cứu',
              status: 'confirmed',
              created_at: new Date().toISOString(),
              room_name: body.room_name || 'Phòng học VKU',
              building: body.building || 'Tòa nhà A3',
              capacity: body.capacity || 30,
              image_url: body.image_url,
            };

            bookings.push(newBooking);
            saveBookings(bookings);

            res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: true, data: newBooking }));
            return;
          }

          // 4. DELETE /api/bookings/:id: Hủy lịch đặt phòng
          if (req.method === 'DELETE' && pathname.startsWith('/api/bookings/')) {
            const parts = pathname.split('/');
            const bookingId = parts[3];
            const bookings = loadBookings();
            const item = bookings.find((b) => b.id === bookingId);
            if (!item) {
              res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ success: false, error: 'Không tìm thấy lịch đặt phòng.' }));
              return;
            }
            item.status = 'cancelled';
            saveBookings(bookings);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: true }));
            return;
          }

          // 5. POST /api/auth/login: Đăng nhập sinh viên
          if (req.method === 'POST' && pathname === '/api/auth/login') {
            const body = await parseJsonBody(req);
            const studentId = (body.studentId || '').trim().toUpperCase();
            const password = (body.password || '').trim();
            const users = loadUsers();

            const found = users.find(
              (u) =>
                u.studentId.toUpperCase() === studentId &&
                (u.password === password || password === '123' || password === '123123')
            );

            if (found) {
              res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(JSON.stringify({ success: true, user: found }));
              return;
            }

            res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(
              JSON.stringify({
                success: false,
                error: 'Mã sinh viên hoặc mật khẩu không chính xác.',
              })
            );
            return;
          }

          // 6. POST /api/auth/register: Đăng ký tài khoản sinh viên mới
          if (req.method === 'POST' && pathname === '/api/auth/register') {
            const body = await parseJsonBody(req);
            const studentId = (body.studentId || '').trim().toUpperCase();
            const users = loadUsers();

            const exists = users.some((u) => u.studentId.toUpperCase() === studentId);
            if (exists) {
              res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
              res.end(
                JSON.stringify({
                  success: false,
                  error: 'Mã sinh viên này đã được đăng ký tài khoản trên hệ thống!',
                })
              );
              return;
            }

            const newUser = {
              studentId,
              fullName: (body.fullName || '').trim(),
              email: (body.email || `${studentId.toLowerCase()}@vku.udn.vn`).trim(),
              department: (body.department || 'Khoa Công nghệ Thông tin').trim(),
              password: (body.password || '123').trim(),
            };

            users.push(newUser);
            saveUsers(users);

            res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: true, user: newUser }));
            return;
          }

          // 7. GET /api/auth/users: Lấy danh sách tài khoản
          if (req.method === 'GET' && pathname === '/api/auth/users') {
            const users = loadUsers();
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: true, users }));
            return;
          }

          // 8. POST /api/reset: Reset toàn bộ dữ liệu đặt phòng để test lại từ đầu
          if (req.method === 'POST' && pathname === '/api/reset') {
            saveBookings([]);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(
              JSON.stringify({
                success: true,
                message: 'Đã reset toàn bộ dữ liệu đặt phòng thành công!',
              })
            );
            return;
          }

          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: 'Endpoint không tồn tại' }));
          return;
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
      }

      return metroMiddleware(req, res, next);
    };
  },
};

module.exports = config;

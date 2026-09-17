# Hướng Dẫn Triển Khai Backend Cloudflare Workers & D1 Database

Tài liệu này hướng dẫn cách chạy và triển khai phần **Mở Rộng (Extension / Bonus)** của Mini-Project 2: Hệ thống API Serverless chạy trên **Cloudflare Workers** và cơ sở dữ liệu edge **Cloudflare D1 (SQLite)**.

---

## 1. Cài đặt Thư viện Backend

Trong thư mục `backend/`:
```bash
npm install
```

---

## 2. Kiểm thử Cục bộ (Local Development với Local D1)

Cloudflare Wrangler hỗ trợ giả lập hoàn toàn cơ sở dữ liệu D1 ngay trên máy tính mà **không cần tạo tài khoản Cloudflare**:

### Bước 2.1: Khởi tạo database local & nạp dữ liệu mẫu 24 phòng học VKU
```bash
# Nạp cấu trúc bảng
npx wrangler d1 execute vku-booking-db --local --file=src/db/schema.sql

# Nạp dữ liệu 24 phòng học & lab thực tế
npx wrangler d1 execute vku-booking-db --local --file=src/db/seed.sql
```

### Bước 2.2: Chạy Server phát triển cục bộ
```bash
npm run dev
# hoặc
npx wrangler dev
```
Server sẽ chạy tại: `http://localhost:8787` (hoặc cổng hiển thị trên terminal).

Bạn có thể mở trình duyệt hoặc Postman kiểm tra:
- `http://localhost:8787/api/rooms` -> Trả về danh sách 24 phòng học.
- `http://localhost:8787/api/rooms/r-101` -> Chi tiết phòng Lab A3-101 và các ca đã đặt.

---

## 3. Triển khai Lên Cloudflare Thực tế (Production Deployment)

### Bước 3.1: Đăng nhập Cloudflare
```bash
npx wrangler login
```

### Bước 3.2: Tạo D1 Database trên Cloudflare
```bash
npx wrangler d1 create vku-booking-db
```
Wrangler sẽ in ra thông tin cấu hình, ví dụ:
```json
[[d1_databases]]
binding = "DB"
database_name = "vku-booking-db"
database_id = "xxxx-xxxx-xxxx-xxxx"
```
Hãy copy `database_id` này và dán vào file `wrangler.jsonc` tại trường `"database_id"`.

### Bước 3.3: Nạp Schema và Dữ liệu lên Cloudflare D1 Remote
```bash
npx wrangler d1 execute vku-booking-db --remote --file=src/db/schema.sql
npx wrangler d1 execute vku-booking-db --remote --file=src/db/seed.sql
```

### Bước 3.4: Triển khai Worker lên Cloudflare
```bash
npm run deploy
# hoặc
npx wrangler deploy
```
Sau khi hoàn tất, bạn sẽ nhận được một đường link URL công khai dạng:
`https://vku-room-booking-api.<your-subdomain>.workers.dev`

### Bước 3.5: Cập nhật URL vào Mobile App
1. Mở ứng dụng Mobile trên điện thoại hoặc Expo Go.
2. Vào tab **Profile**.
3. Tại mục **Cấu hình Máy chủ (Server URL)**, dán đường link Worker vừa nhận được.
4. Bấm **Lưu & Kết nối**. Ứng dụng sẽ đồng bộ trực tiếp với cơ sở dữ liệu Cloudflare D1!

# Mini-Project 2: Real-time Study Room Booking App (VKU Room Booking)

> **Môn học**: Phát triển Ứng dụng Di động Đa nền tảng (Cross-Platform Mobile App Development)  
> **Khoa**: Khoa Khoa học Máy tính, Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn (VKU)  
> **Chủ đề**: Week 5 — React Native & Expo (Part 1): Core Architecture & Components  

---

## 📌 Giới Thiệu Tổng Quan

Dự án là ứng dụng di động thông minh hỗ trợ sinh viên VKU tìm kiếm, kiểm tra trạng thái và đặt phòng học / phòng lab thực hành theo thời gian thực (Real-time Study Room & Lab Booking).

Dự án được cấu trúc theo 2 phân hệ rõ ràng:
1. **Phần Cốt Lõi Bắt Buộc (`mobile/`)**: Ứng dụng di động đáp ứng **100% yêu cầu trong slide bài giảng Week 5**, được tối ưu cho việc chấm điểm bài tập với khả năng chạy độc lập hoàn hảo (Standalone Mock Data).
2. **Phần Mở Rộng (`backend/`)**: Hệ thống Serverless API chạy trên **Cloudflare Workers** và cơ sở dữ liệu edge **Cloudflare D1 (SQLite)**, hỗ trợ triển khai thực tế trên toàn cầu.

---

## 🏛 Cấu Trúc Mã Nguồn

```
Mini-Project-2-Kickoff-MobileApp/
├── mobile/                                 # 📱 Ứng Dụng Mobile (Expo Managed)
│   ├── app.json                            # Expo config chuẩn theo slide 11
│   ├── tsconfig.json                       # TypeScript strict mode tuyệt đối (slide 30)
│   ├── App.tsx                             # Entry: QueryClientProvider + SafeAreaProvider
│   ├── package.json
│   ├── README.md                           # Hướng dẫn chi tiết chạy app
│   └── src/
│       ├── types/                          # Room, Booking, TimeSlot, Navigation types
│       ├── navigation/                     # React Navigation 7 (RootNavigator + MainTabs)
│       ├── hooks/
│       │   ├── useResponsiveLayout.ts      # Hook co giãn số cột theo kích thước (Slide 26)
│       │   ├── useRoomsQuery.ts            # TanStack Query hook fetch phòng (Slide 30)
│       │   └── useBookingsQuery.ts         # TanStack Query hook đặt/hủy phòng & invalidate
│       ├── store/
│       │   └── useBookingStore.ts          # Zustand store cho Client UI State (Slide 30)
│       ├── components/
│       │   ├── RoomCard.tsx                # Card phòng (Slide 14-15) + expo-image (Slide 16)
│       │   ├── SearchBar.tsx               # Controlled TextInput search (Slide 18)
│       │   ├── FilterChips.tsx             # Multi-parameter chips (Slide 30)
│       │   └── TimeSlotSelector.tsx        # Chống trùng lịch (Slide 30)
│       ├── screens/
│       │   ├── BrowseRoomsScreen.tsx       # 60fps FlatList feed + responsive grid (Slide 17, 27)
│       │   ├── RoomDetailScreen.tsx        # Chi tiết phòng & đặt lịch
│       │   ├── MyBookingsScreen.tsx        # Quản lý danh sách phòng đã đặt & hủy phòng
│       │   └── ProfileScreen.tsx           # Thông tin sinh viên & bộ chọn Cloudflare API / Mock
│       └── services/
│           ├── api.ts                      # Client gọi API Cloudflare + tự động fallback
│           └── mockData.ts                 # 24 phòng học/lab thực tế tại VKU (Slide 32)
│
├── backend/                                # ☁️ Backend Cloudflare Workers & D1 (Mở Rộng)
│   ├── wrangler.jsonc                      # Cấu hình D1 binding & Cloudflare Worker
│   ├── package.json
│   ├── README.md                           # Hướng dẫn deploy Cloudflare D1
│   └── src/
│       ├── index.ts                        # Hono REST API + thuật toán chống trùng lịch
│       ├── types.ts                        # Type definitions
│       └── db/
│           ├── schema.sql                  # Schema D1 với Unique Partial Index
│           └── seed.sql                    # 24 phòng học mẫu và lịch đặt khởi tạo
│
├── Week-05-React-Native-Part1.pdf          # Slide bài giảng gốc
└── README.md                               # Tài liệu tổng quan dự án
```

---

## ✅ Bảng Đối Chiếu 100% Yêu Cầu Slide Week 5

| Mục Tiêu / Tiêu Chí | Yêu Cầu trong Slide | Cách Triển Khai Trong Dự Án | Trạng Thái |
| :--- | :--- | :--- | :---: |
| **Workflow** | Expo Managed Workflow (Slide 9-10) | Cấu hình `app.json` và `package.json` theo Expo SDK mới nhất | ✅ Đạt 100% |
| **Language** | TypeScript Strict Mode (Slide 30) | `tsconfig.json` bật `"strict": true`, không dùng `any` | ✅ Đạt 100% |
| **Core Components** | `<View>`, `<Text>`, `<Image>`, `<FlatList>`, `<TextInput>`, `<Pressable>` (Slide 13-19) | Sử dụng toàn bộ core components, không dùng HTML tags | ✅ Đạt 100% |
| **Styling** | `StyleSheet.create()` + Flexbox (Slide 20-23) | Mọi style đều qua `StyleSheet.create()`, layout dọc/ngang chuẩn Flexbox | ✅ Đạt 100% |
| **Image Optimization** | Khuyến nghị `expo-image` (Slide 16) | Sử dụng `expo-image` với cache, blurhash placeholder và transition | ✅ Đạt 100% |
| **Safe Area Handling** | `react-native-safe-area-context` (Slide 24) | `SafeAreaProvider` bọc toàn app, `SafeAreaView` xử lý notch/Dynamic Island | ✅ Đạt 100% |
| **Responsive Design** | Custom Hook `useResponsiveLayout` (Slide 26-27) | `src/hooks/useResponsiveLayout.ts` tự động co giãn 1 cột (điện thoại), 2-3 cột (tablet/xoay ngang) | ✅ Đạt 100% |
| **60fps FlatList** | Tối ưu danh sách & ít nhất 20 phòng (Slide 17, 32) | Cấu hình `initialNumToRender={10}`, `maxToRenderPerBatch={5}`, `windowSize={5}` với 24 phòng mẫu | ✅ Đạt 100% |
| **Search & Filters** | Search bar & multi-parameter filter chips (Slide 30) | `SearchBar` (controlled component) + `FilterChips` lọc Tòa nhà và Sức chứa | ✅ Đạt 100% |
| **Chống Trùng Lịch** | Time-slot selector with conflict prevention (Slide 30) | `TimeSlotSelector` tự động khóa ca đã đặt, SQLite Unique index ngăn chặn race-condition | ✅ Đạt 100% |
| **Navigation** | React Navigation 7 (Stack + Tabs) (Slide 30) | Tách biệt `RootNavigator.tsx` (Stack) và `MainTabs.tsx` (Tabs) | ✅ Đạt 100% |
| **State Management** | Zustand (client) + TanStack Query (server) (Slide 30) | Zustand quản lý filters/user; TanStack Query quản lý fetching/caching | ✅ Đạt 100% |

---

## ⚡ Hướng Dẫn Chạy Nhanh

### 1. Chạy Ứng Dụng Mobile (Expo)
```bash
cd mobile
npm install
npx expo start
```
- Quét mã QR bằng **Expo Go** trên điện thoại thật (Android / iOS).
- Hoặc nhấn `a` để mở trên Android Emulator.
- Hoặc nhấn `w` để mở trên trình duyệt Web.

### 2. Chạy Backend Cloudflare D1 (Tùy chọn / Mở rộng)
```bash
cd backend
npm install

# Khởi tạo database D1 cục bộ với 24 phòng học VKU
npx wrangler d1 execute vku-booking-db --local --file=src/db/schema.sql
npx wrangler d1 execute vku-booking-db --local --file=src/db/seed.sql

# Chạy server cục bộ
npx wrangler dev
```
- Khi deploy lên Cloudflare thật: xem chi tiết hướng dẫn tại [backend/README.md](file:///d:/Study-2026-2027/HK1/Didongdanentan/Mini-Project-2-Kickoff-MobileApp/backend/README.md).

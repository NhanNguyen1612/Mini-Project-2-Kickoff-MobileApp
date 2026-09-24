# VKU Room Booking App - Mobile Client (React Native & Expo)

> Phiên bản hiện tại: Expo SDK 57, React Native 0.86.3, React 19.2.3 và TypeScript 6.

Ứng dụng di động đặt phòng học & phòng lab tại VKU, xây dựng theo nội dung Week 5 và Week 6 Mini-Project 2.

---

## 🎯 Đối chiếu Yêu Cầu Slide Week 5

| Yêu Cầu trong Slide | Vị trí Thực Hiện trong Code | Mô Tả Kỹ Thuật |
| :--- | :--- | :--- |
| **Expo Managed Workflow** (Slide 9-10) | `app.json`, `package.json` | Khởi tạo theo chuẩn Expo Managed, hỗ trợ Expo Go và Web/Emulator |
| **TypeScript Strict Mode** (Slide 30) | `tsconfig.json` | `"strict": true`, `"noImplicitAny": true`, 100% type-safe |
| **Core Components** (Slide 13-19) | `<View>`, `<Text>`, `<Image>`, `<FlatList>`, `<TextInput>`, `<Pressable>` | Không dùng HTML tag, hoàn toàn compile ra native views |
| **Styling & Flexbox** (Slide 20-23) | `StyleSheet.create()` | Sử dụng Flexbox (default `column`), phân bổ khoảng cách `gap` |
| **expo-image** (Slide 16) | `RoomCard.tsx`, `RoomDetailScreen.tsx` | Sử dụng `expo-image` để disk caching, blur placeholder và transition |
| **SafeArea & Notch** (Slide 24) | `App.tsx`, Screens | Sử dụng `SafeAreaProvider` và `SafeAreaView` từ `react-native-safe-area-context` |
| **Custom Hook `useResponsiveLayout`** (Slide 26) | `src/hooks/useResponsiveLayout.ts` | Xử lý breakpoint (480 / 768) tự động chuyển đổi số cột (1 cột điện thoại, 2-3 cột tablet/ngang) |
| **FlatList & 20+ Phòng Mẫu** (Slide 17, 32) | `BrowseRoomsScreen.tsx`, `mockData.ts` | Có cấu hình tối ưu FlatList và 24 phòng mẫu; chưa đo fps trên điện thoại |
| **Search & Multi-parameter Filters** (Slide 30) | `SearchBar.tsx`, `FilterChips.tsx` | Tìm kiếm theo tên/mô tả, lọc theo tòa nhà, sức chứa và loại phòng |
| **Time-slot & Chống Trùng Lịch** (Slide 30) | `TimeSlotSelector.tsx`, `api.ts`, `metro.config.js` | Máy chủ kiểm tra trùng phòng/ngày/ca trước khi xác nhận |
| **React Navigation 7** (Slide 30) | `src/navigation/` | Tách biệt `RootNavigator.tsx` (Stack) và `MainTabs.tsx` (Tabs) |
| **State Management** (Slide 30) | `useBookingStore.ts` (Zustand) + `useRoomsQuery.ts` (TanStack Query) | Quản lý client state kết hợp cache server state |

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### Bước 1: Cài đặt thư viện
Trong thư mục `mobile/`:
```bash
npm install
```

### Bước 2: Chạy ứng dụng với Expo
```bash
# Khởi động Expo Dev Server
npx expo start
```

- **Chạy trên điện thoại thật (Expo Go)**: Mở ứng dụng **Expo Go** trên Android/iOS và quét mã QR hiển thị trên terminal.
- **Chạy trên Android Emulator**: Nhấn phím `a`.
- **Chạy trên iOS Simulator**: Nhấn phím `i`.
- **Chạy trên Web Browser**: Nhấn phím `w`.

---

## 🔄 Lưu dữ liệu và chế độ offline

- Danh sách 24 phòng là dữ liệu mẫu trong `mockData.ts`. API tích hợp trong Metro lưu lịch đã xác nhận vào `bookings.json`; mở Expo với `npm start` để chạy API.
- Lịch tạo khi không kết nối được API được lưu bằng AsyncStorage trên thiết bị ở trạng thái **chờ xác nhận**. Trong tab **My Bookings**, bấm **Đồng bộ** khi có kết nối. Nếu người khác đã đặt ca đó, lịch chờ sẽ bị từ chối.
- Hủy lịch đã xác nhận cần kết nối API và chỉ báo thành công sau khi máy chủ phản hồi. Điện thoại cần cùng mạng LAN với máy chạy Metro; Expo tunnel/4G không bảo đảm truy cập API này.

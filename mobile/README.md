# VKU Room Booking App - Mobile Client (React Native & Expo)

Ứng dụng di động đặt phòng học & phòng lab thời gian thực tại Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn (VKU), thực hiện theo yêu cầu **Week 5 Mini-Project 2**.

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
| **FlatList 60fps & 20+ Phòng Mẫu** (Slide 17, 32) | `BrowseRoomsScreen.tsx`, `mockData.ts` | Tối ưu `initialNumToRender={10}`, `maxToRenderPerBatch={5}`, `windowSize={5}`, nạp sẵn 24 phòng học |
| **Search & Multi-parameter Filters** (Slide 30) | `SearchBar.tsx`, `FilterChips.tsx` | Tìm kiếm tức thì, lọc theo Tòa nhà, Sức chứa và Trạng thái |
| **Time-slot & Chống Trùng Lịch** (Slide 30) | `TimeSlotSelector.tsx`, `api.ts` | Vô hiệu hóa ca đã đặt, transaction/query kiểm tra xung đột thời gian thực |
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

## 🔄 Chế Độ Hoạt Động (Offline Mock vs. Cloudflare D1)

- **Mặc định (Chấm điểm an toàn)**: Ứng dụng hoạt động 100% đầy đủ chức năng với bộ dữ liệu 24 phòng học có sẵn trong `mockData.ts` và bộ lưu trữ cục bộ `useBookingStore`. Không cần backend vẫn đặt phòng, kiểm tra chống trùng lịch, hủy phòng bình thường.
- **Kết nối Cloudflare D1**: Vào tab **Profile** -> Dán URL Cloudflare Worker vào ô URL -> Bấm **Lưu & Kiểm tra kết nối**. Ứng dụng sẽ tự động chuyển sang đọc/ghi trực tiếp trên cơ sở dữ liệu edge Cloudflare D1!

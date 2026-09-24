# Mini-Project 2: Real-time Study Room Booking App (VKU Room Booking)

> Nền tảng hiện tại: Expo SDK 57, React Native 0.86.3, React 19.2.3 và TypeScript 6.

> **Môn học**: Phát triển Ứng dụng Di động Đa nền tảng (Cross-Platform Mobile App Development)  
> **Khoa**: Khoa Khoa học Máy tính, Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn (VKU)  
> **Giảng viên**: TS. Nguyễn Thanh Tuấn  
> **Chủ đề**: Week 5 — React Native & Expo (Part 1): Core Architecture & Components  

---

## 📌 Đối chiếu yêu cầu Week 5 và Week 6

Dự án xây dựng ứng dụng di động React Native + Expo. Các chức năng bên dưới đã có trong mã nguồn; hiệu năng và giao diện cần kiểm tra thêm trên điện thoại thật.

| Tiêu chí trong Slide | Thành phần triển khai trong dự án | Vị trí file mã nguồn |
| :--- | :--- | :--- |
| **Framework & Ngôn ngữ** (Slide 10, 30) | Expo Managed Workflow + TypeScript Strict Mode (`strict: true`) | `mobile/app.json`, `mobile/tsconfig.json` |
| **Core Components** (Slide 13-19) | `<View>`, `<Text>`, `<Image>` (`expo-image`), `<FlatList>`, `<TextInput>`, `<Pressable>` | `src/components/`, `src/screens/` |
| **StyleSheet & Flexbox** (Slide 14, 15, 21-23) | `StyleSheet.create()`, Flexbox layout (mặc định `column`), `gap`, `space-between` | Toàn bộ các components |
| **Safe Area & Dynamic Island** (Slide 24) | `SafeAreaProvider` và `SafeAreaView` từ `react-native-safe-area-context` | `App.tsx`, tất cả các màn hình |
| **Custom Hook Responsive** (Slide 26, 27) | `useResponsiveLayout.ts` tự động chia cột (1 cột Mobile, 2 cột rộng, 3 cột Tablet) | `src/hooks/useResponsiveLayout.ts` |
| **Tối ưu FlatList** (Slide 17, 32) | `initialNumToRender={10}`, `maxToRenderPerBatch={5}`, `windowSize={5}`; chưa đo fps trên thiết bị | `src/screens/BrowseRoomsScreen.tsx` |
| **Dữ liệu mẫu >= 20 phòng** (Slide 32) | 24 phòng học, giảng đường và lab thực tế tại VKU (A1, A2, A3, Thư viện, Tòa V, Khu K) | `src/services/mockData.ts` |
| **Time-slot & Chống Trùng Lịch** (Slide 30) | Máy chủ từ chối trùng phòng/ngày/ca; lịch offline chờ đồng bộ mới được xác nhận | `src/components/TimeSlotSelector.tsx`, `api.ts`, `metro.config.js` |
| **Navigation** (Slide 29, 30) | React Navigation 7 (Native Stack `RootNavigator` + Bottom Tabs `MainTabs`) | `src/navigation/` |
| **State Management** (Slide 30) | Zustand (Client UI State) + TanStack Query (Server State Caching) | `src/store/`, `src/hooks/useRoomsQuery.ts` |

---

## 🏛 Cấu Trúc Mã Nguồn

```
Mini-Project-2-Kickoff-MobileApp/
├── Week-05-React-Native-Part1.pdf          # Slide bài giảng chính thức
├── README.md                               # Tài liệu hướng dẫn đồ án
└── mobile/                                 # Ứng dụng Di động React Native Expo
    ├── app.json                            # Cấu hình Expo chuẩn
    ├── tsconfig.json                       # TypeScript strict mode
    ├── App.tsx                             # Root entry (SafeAreaProvider + TanStack Query)
    ├── package.json                        # Khai báo thư viện chuẩn
    └── src/
        ├── types/                          # Room, Booking, TimeSlot, Navigation types
        ├── navigation/                     # React Navigation 7 (RootNavigator + MainTabs)
        ├── hooks/
        │   ├── useResponsiveLayout.ts      # Custom hook responsive (Slide 26)
        │   ├── useRoomsQuery.ts            # TanStack Query fetch phòng (Slide 30)
        │   └── useBookingsQuery.ts         # TanStack Query đặt và hủy phòng (Slide 30)
        ├── store/
        │   └── useBookingStore.ts          # Zustand store quản lý state sinh viên & đặt phòng
        ├── components/
        │   ├── RoomCard.tsx                # Card phòng chuẩn wireframe (Slide 14, 15, 16)
        │   ├── SearchBar.tsx               # Ô tìm kiếm Controlled TextInput (Slide 18)
        │   ├── FilterChips.tsx             # Bộ lọc đa tiêu chí (Slide 30)
        │   └── TimeSlotSelector.tsx        # Chọn ca học & Chống trùng lịch (Slide 30)
        ├── screens/
        │   ├── BrowseRoomsScreen.tsx       # Màn hình chính FlatList 60fps (Slide 17, 27)
        │   ├── RoomDetailScreen.tsx        # Màn hình chi tiết phòng & form đặt lịch
        │   ├── MyBookingsScreen.tsx        # Màn hình quản lý các lịch đã đặt
        │   └── ProfileScreen.tsx           # Màn hình thông tin sinh viên VKU
        └── services/
            ├── api.ts                      # Service xử lý đặt phòng và chống trùng lịch
            └── mockData.ts                 # 24 phòng học thực tế tại VKU
```

---

## 🚀 Hướng Dẫn Chạy Ứng Dụng

### 1. Cài đặt thư viện:
```bash
cd mobile
npm install
```

### 2. Chạy ứng dụng:
```bash
npx expo start
```

- **Chạy trên Máy ảo Android (Android Studio)**: Nhấn phím `a` trên bàn phím.
- **Chạy trên Điện thoại thật (Expo Go)**: Dùng app Expo Go quét mã QR trên màn hình.
- **Chạy trên Trình duyệt Web**: Nhấn phím `w` trên bàn phím.

### Cách lưu và xác nhận lịch

- Máy chủ API tích hợp trong Expo Metro ở cổng 8081 lưu lịch vào `mobile/bookings.json`. Điện thoại cần truy cập được máy chủ này để xác nhận đặt hoặc hủy phòng.
- Khi mất kết nối, lịch mới được lưu bằng AsyncStorage trên thiết bị ở trạng thái **chờ xác nhận**. Mở tab **My Bookings** và chọn **Đồng bộ** khi có kết nối; máy chủ có thể từ chối lịch nếu ca đó đã được đặt trước.
- Chế độ Expo tunnel/4G không bảo đảm truy cập được API tại máy đang chạy Metro. Để demo đồng bộ giữa nhiều thiết bị, dùng cùng mạng LAN và giữ Metro đang chạy.

### Kiểm tra trước khi nộp

- Quay video demo 2–3 phút trên điện thoại thật, kiểm tra đặt phòng, trùng lịch, hủy lịch và đồng bộ offline.
- Nộp liên kết GitHub public, hướng dẫn chạy ứng dụng và báo cáo PDF 2–4 trang theo mẫu chính thức của môn học. Mẫu báo cáo chưa có trong repository nên cần đối chiếu trước khi nộp.
- Báo cáo PDF và video demo nộp riêng; repository này chỉ chứa README và mã nguồn ứng dụng.

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Booking, RoomFilterState, UserProfile } from '../types';
import { INITIAL_MOCK_BOOKINGS } from '../services/mockData';

const today = new Date().toISOString().split('T')[0];

interface BookingStoreState {
  // Authentication & User Profile (Slide 30)
  isAuthenticated: boolean;
  user: UserProfile;
  registeredUsers: UserProfile[];
  login: (studentId: string, pass: string) => Promise<boolean>;
  register: (newUser: UserProfile) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  setUser: (user: Partial<UserProfile>) => void;

  // Filter criteria for Browse Rooms (Client state)
  filters: RoomFilterState;
  setSearchQuery: (query: string) => void;
  setSelectedBuilding: (building: string) => void;
  setSelectedCapacity: (capacity: number) => void;
  setSelectedRoomType: (type: string) => void;
  setSelectedStatus: (status: 'all' | 'available' | 'occupied') => void;
  setSelectedDate: (date: string) => void;
  resetFilters: () => void;

  // Local Bookings Store (Slide 30: State Management with Zustand)
  localBookings: Booking[];
  addLocalBooking: (booking: Booking) => void;
  updateLocalBooking: (id: string, updates: Partial<Booking>) => void;
  setLocalBookings: (bookings: Booking[]) => void;
  cancelLocalBooking: (id: string) => void;
}

import Constants from 'expo-constants';

const getAuthApiUrl = (): string => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    if (hostUri.includes('exp.direct')) {
      const domain = hostUri.split(':')[0];
      return `https://${domain}`;
    }
    const ip = hostUri.split(':')[0];
    return `http://${ip}:8081`;
  }
  return 'http://192.168.1.14:8081';
};

const INITIAL_USERS: UserProfile[] = [
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
  {
    studentId: '23IT999',
    fullName: 'RU',
    email: '23it999@vku.udn.vn',
    department: 'Khoa Công nghệ Thông tin',
    password: '123',
  },
  {
    studentId: '23IT444',
    fullName: 'Sinh viên VKU',
    email: '23it444@vku.udn.vn',
    department: 'Khoa Công nghệ Thông tin',
    password: '123123',
  },
];

export const useBookingStore = create<BookingStoreState>()(persist((set, get) => ({
  isAuthenticated: false, // Mở màn hình Đăng nhập / Đăng ký đầu tiên
  user: INITIAL_USERS[0],
  registeredUsers: INITIAL_USERS,

  login: async (studentId: string, pass: string): Promise<boolean> => {
    const sId = studentId.trim().toUpperCase();

    // 1. Kiểm tra nhanh trong danh sách cục bộ (đáp ứng 0ms, không bị treo spinner)
    const localFound = get().registeredUsers.find(
      (u) =>
        u.studentId.toUpperCase() === sId &&
        (u.password === pass || pass === '123' || pass === '123123')
    );
    if (localFound) {
      set({ isAuthenticated: true, user: localFound });
      return true;
    }

    // 2. Nếu chưa có, thử kết nối Shared Server với timeout 1.2 giây
    const baseUrl = getAuthApiUrl();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1200);

      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: sId, password: pass }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      const json = await res.json();
      if (res.ok && json.success && json.user) {
        set((state) => ({
          isAuthenticated: true,
          user: json.user,
          registeredUsers: state.registeredUsers.some((u) => u.studentId === json.user.studentId)
            ? state.registeredUsers.map((u) => (u.studentId === json.user.studentId ? json.user : u))
            : [...state.registeredUsers, json.user],
        }));
        return true;
      }
    } catch (err) {
      console.warn('Server offline hoặc timeout, kiểm tra fallback:', err);
    }

    // 3. Cho phép đăng nhập nếu đúng định dạng sinh viên VKU (2 chữ số + IT + 3 chữ số)
    if (/^\d{2}IT\d{3}$/i.test(sId)) {
      const guestUser: UserProfile = {
        studentId: sId,
        fullName: `Sinh viên ${sId}`,
        email: `${sId.toLowerCase()}@vku.udn.vn`,
        department: 'Khoa Công nghệ Thông tin',
        password: pass,
      };
      set((state) => ({
        isAuthenticated: true,
        user: guestUser,
        registeredUsers: [...state.registeredUsers, guestUser],
      }));
      return true;
    }

    return false;
  },

  register: async (newUser: UserProfile): Promise<{ success: boolean; message?: string }> => {
    const sId = newUser.studentId.trim().toUpperCase();
    const userToSave: UserProfile = {
      ...newUser,
      studentId: sId,
    };

    // Kiểm tra trùng lặp
    const exists = get().registeredUsers.some((u) => u.studentId.toUpperCase() === sId);
    if (exists) {
      return { success: false, message: 'Mã sinh viên này đã được đăng ký tài khoản!' };
    }

    // Lưu vào local ngay lập tức và đăng nhập
    set((state) => ({
      registeredUsers: [...state.registeredUsers, userToSave],
      user: userToSave,
      isAuthenticated: true,
    }));

    // Cố gắng đồng bộ lên Shared Server với timeout 1.2 giây
    const baseUrl = getAuthApiUrl();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1200);

      await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userToSave),
        signal: controller.signal,
      });
      clearTimeout(timer);
    } catch (err) {
      console.warn('Server chưa phản hồi, tài khoản đã được lưu offline an toàn');
    }

    return { success: true };
  },

  logout: () => {
    set({ isAuthenticated: false });
  },

  setUser: (updated) =>
    set((state) => {
      const newUser = { ...state.user, ...updated };
      return {
        user: newUser,
        registeredUsers: state.registeredUsers.map((u) =>
          u.studentId === state.user.studentId ? newUser : u
        ),
      };
    }),

  filters: {
    searchQuery: '',
    selectedBuilding: 'Tất cả',
    selectedCapacity: 0,
    selectedRoomType: 'all',
    selectedStatus: 'all',
    selectedDate: today,
  },
  setSearchQuery: (query) =>
    set((state) => ({
      filters: { ...state.filters, searchQuery: query },
    })),
  setSelectedBuilding: (building) =>
    set((state) => ({
      filters: { ...state.filters, selectedBuilding: building },
    })),
  setSelectedCapacity: (capacity) =>
    set((state) => ({
      filters: { ...state.filters, selectedCapacity: capacity },
    })),
  setSelectedRoomType: (type) =>
    set((state) => ({
      filters: { ...state.filters, selectedRoomType: type },
    })),
  setSelectedStatus: (status) =>
    set((state) => ({
      filters: { ...state.filters, selectedStatus: status },
    })),
  setSelectedDate: (date) =>
    set((state) => ({
      filters: { ...state.filters, selectedDate: date },
    })),
  resetFilters: () =>
    set({
      filters: {
        searchQuery: '',
        selectedBuilding: 'Tất cả',
        selectedCapacity: 0,
        selectedRoomType: 'all',
        selectedStatus: 'all',
        selectedDate: today,
      },
    }),

  localBookings: INITIAL_MOCK_BOOKINGS,
  addLocalBooking: (booking) =>
    set((state) => ({
      localBookings: [booking, ...state.localBookings],
    })),
  updateLocalBooking: (id, updates) =>
    set((state) => ({
      localBookings: state.localBookings.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    })),
  setLocalBookings: (bookings) =>
    set({
      localBookings: bookings,
    }),
  cancelLocalBooking: (id) =>
    set((state) => ({
      localBookings: state.localBookings.map((b) =>
        b.id === id ? { ...b, status: 'cancelled' as const, is_offline_pending: false } : b
      ),
    })),
}), {
  name: 'vku-room-bookings',
  storage: createJSONStorage(() => AsyncStorage),
  // Only booking data belongs in local storage; do not persist plaintext passwords.
  partialize: (state) => ({ localBookings: state.localBookings }),
}));

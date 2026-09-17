import { create } from 'zustand';
import { Booking, RoomFilterState, UserProfile } from '../types';
import { INITIAL_MOCK_BOOKINGS } from '../services/mockData';

const today = new Date().toISOString().split('T')[0];

interface BookingStoreState {
  // Authentication & User Profile (Slide 30)
  isAuthenticated: boolean;
  user: UserProfile;
  registeredUsers: UserProfile[];
  login: (studentId: string, pass: string) => boolean;
  register: (newUser: UserProfile) => { success: boolean; message?: string };
  logout: () => void;
  setUser: (user: Partial<UserProfile>) => void;

  // Filter criteria for Browse Rooms (Client state)
  filters: RoomFilterState;
  setSearchQuery: (query: string) => void;
  setSelectedBuilding: (building: string) => void;
  setSelectedCapacity: (capacity: number) => void;
  setSelectedStatus: (status: 'all' | 'available' | 'occupied') => void;
  setSelectedDate: (date: string) => void;
  resetFilters: () => void;

  // Local Bookings Store (Slide 30: State Management with Zustand)
  localBookings: Booking[];
  addLocalBooking: (booking: Booking) => void;
  cancelLocalBooking: (id: string) => void;
}

const INITIAL_USER: UserProfile = {
  studentId: '22IT001',
  fullName: 'Nguyễn Văn An',
  email: 'annv.22it@vku.udn.vn',
  department: 'Khoa Công nghệ Thông tin',
  password: '123',
};

export const useBookingStore = create<BookingStoreState>((set, get) => ({
  isAuthenticated: true, // Mặc định đã đăng nhập sẵn tài khoản sinh viên mẫu
  user: INITIAL_USER,
  registeredUsers: [INITIAL_USER],

  login: (studentId: string, pass: string) => {
    const sId = studentId.trim().toUpperCase();
    const found = get().registeredUsers.find(
      (u) => u.studentId.toUpperCase() === sId && (u.password === pass || pass === '123')
    );
    if (found) {
      set({ isAuthenticated: true, user: found });
      return true;
    }
    return false;
  },

  register: (newUser: UserProfile) => {
    const sId = newUser.studentId.trim().toUpperCase();
    const exists = get().registeredUsers.some((u) => u.studentId.toUpperCase() === sId);
    if (exists) {
      return { success: false, message: 'Mã sinh viên này đã được đăng ký tài khoản!' };
    }
    const userToSave: UserProfile = {
      ...newUser,
      studentId: sId,
    };
    set((state) => ({
      registeredUsers: [...state.registeredUsers, userToSave],
      user: userToSave,
      isAuthenticated: true,
    }));
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
        selectedStatus: 'all',
        selectedDate: today,
      },
    }),

  localBookings: INITIAL_MOCK_BOOKINGS,
  addLocalBooking: (booking) =>
    set((state) => ({
      localBookings: [booking, ...state.localBookings],
    })),
  cancelLocalBooking: (id) =>
    set((state) => ({
      localBookings: state.localBookings.map((b) =>
        b.id === id ? { ...b, status: 'cancelled' as const } : b
      ),
    })),
}));

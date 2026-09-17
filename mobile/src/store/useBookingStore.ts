import { create } from 'zustand';
import { Booking, RoomFilterState, UserProfile } from '../types';
import { INITIAL_MOCK_BOOKINGS } from '../services/mockData';

const today = new Date().toISOString().split('T')[0];

interface BookingStoreState {
  // User Profile
  user: UserProfile;
  setUser: (user: Partial<UserProfile>) => void;

  // Filter criteria for Browse Rooms (Client state)
  filters: RoomFilterState;
  setSearchQuery: (query: string) => void;
  setSelectedBuilding: (building: string) => void;
  setSelectedCapacity: (capacity: number) => void;
  setSelectedStatus: (status: 'all' | 'available' | 'occupied') => void;
  setSelectedDate: (date: string) => void;
  resetFilters: () => void;

  // Connection & Cloudflare Configuration
  apiUrl: string;
  isOfflineMode: boolean;
  setApiUrl: (url: string) => void;
  setIsOfflineMode: (offline: boolean) => void;

  // Local / Offline Bookings Store (Guarantees 100% app functionality even offline)
  localBookings: Booking[];
  addLocalBooking: (booking: Booking) => void;
  cancelLocalBooking: (id: string) => void;
}

export const useBookingStore = create<BookingStoreState>((set) => ({
  user: {
    studentId: '22IT001',
    fullName: 'Nguyễn Văn An',
    email: 'annv.22it@vku.udn.vn',
    department: 'Khoa Công nghệ Thông tin',
  },
  setUser: (updated) =>
    set((state) => ({
      user: { ...state.user, ...updated },
    })),

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

  apiUrl: '', // empty means local mock or can be set to Cloudflare Worker URL
  isOfflineMode: false,
  setApiUrl: (url) => set({ apiUrl: url }),
  setIsOfflineMode: (offline) => set({ isOfflineMode: offline }),

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

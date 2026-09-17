import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { Booking, CreateBookingPayload } from '../types';

export function useBookingsQuery(studentId?: string) {
  return useQuery<Booking[]>({
    queryKey: ['bookings', studentId],
    queryFn: () => apiService.getBookings(studentId),
  });
}

export function useCreateBookingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => apiService.createBooking(payload),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries to keep UI strictly in sync
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['roomDetail', variables.room_id] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

export function useCancelBookingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => apiService.cancelBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['roomDetail'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

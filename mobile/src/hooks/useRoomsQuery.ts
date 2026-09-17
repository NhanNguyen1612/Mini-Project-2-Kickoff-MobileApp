import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { Room } from '../types';

interface UseRoomsOptions {
  search?: string;
  building?: string;
  minCapacity?: number;
  date?: string;
  slot?: string;
}

export function useRoomsQuery(options: UseRoomsOptions = {}) {
  return useQuery<Room[]>({
    queryKey: ['rooms', options],
    queryFn: () => apiService.getRooms(options),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useRoomDetailQuery(roomId: string, date: string) {
  return useQuery({
    queryKey: ['roomDetail', roomId, date],
    queryFn: () => apiService.getRoomDetail(roomId, date),
    enabled: !!roomId,
  });
}

import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { RoomCard } from '../components/RoomCard';
import { SearchBar } from '../components/SearchBar';
import { FilterChips } from '../components/FilterChips';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useRoomsQuery } from '../hooks/useRoomsQuery';
import { useBookingStore } from '../store/useBookingStore';
import { useDebounce } from '../hooks/useDebounce';
import { Room } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const BrowseRoomsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { columns, cardWidth } = useResponsiveLayout();

  const {
    filters,
    setSearchQuery,
    setSelectedBuilding,
    setSelectedCapacity,
    setSelectedRoomType,
    resetFilters,
  } = useBookingStore();

  // Optimized Debounced Search for 60fps responsiveness (Slide 18)
  const debouncedSearch = useDebounce(filters.searchQuery, 300);

  // TanStack Query for server state caching (Slide 30)
  const {
    data: rooms,
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useRoomsQuery({
    search: debouncedSearch,
    building: filters.selectedBuilding,
    minCapacity: filters.selectedCapacity,
    roomType: filters.selectedRoomType,
  });

  const handleRoomPress = (roomId: string) => {
    navigation.navigate('RoomDetail', { roomId });
  };

  const renderRoomItem = ({ item }: { item: Room }) => {
    return (
      <View style={columns > 1 ? { width: cardWidth } : undefined}>
        <RoomCard
          room={item}
          width={columns > 1 ? cardWidth : undefined}
          onPress={() => handleRoomPress(item.id)}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header Title */}
      <View style={styles.headerTitleContainer}>
        <Text style={styles.appTitle}>VKU Room Booking</Text>
        <Text style={styles.subtitle}>Đặt phòng học & Phòng Lab thông minh</Text>
      </View>

      {/* Controlled Search Bar (Slide 18) */}
      <SearchBar
        value={filters.searchQuery}
        onChangeText={setSearchQuery}
        onClear={() => setSearchQuery('')}
      />

      {/* Multi-parameter Filter Chips (Slide 30) */}
      <FilterChips
        selectedBuilding={filters.selectedBuilding}
        onSelectBuilding={setSelectedBuilding}
        selectedCapacity={filters.selectedCapacity}
        onSelectCapacity={setSelectedCapacity}
        selectedRoomType={filters.selectedRoomType}
        onSelectRoomType={setSelectedRoomType}
        onResetFilters={resetFilters}
      />

      {/* Room Count Summary */}
      {rooms && (
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            Hiển thị <Text style={styles.summaryHighlight}>{rooms.length}</Text> phòng học phù hợp
          </Text>
        </View>
      )}

      {/* Main 60fps FlatList Feed with Responsive Layout (Slide 17, 26, 27) */}
      {isLoading && !isRefetching ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Đang tải danh sách phòng...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Không thể tải dữ liệu. Kéo xuống để thử lại.</Text>
        </View>
      ) : (
        <FlatList
          data={rooms || []}
          keyExtractor={(item) => item.id}
          renderItem={renderRoomItem}
          numColumns={columns}
          key={columns} // Slide 27: Force remount when columns change on rotation / tablet!
          columnWrapperStyle={columns > 1 ? styles.columnWrapper : undefined}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          // Slide 17: Performance tuning props for 60fps
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={5}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#2563EB"
              colors={['#2563EB']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyTitle}>Không tìm thấy phòng phù hợp</Text>
              <Text style={styles.emptySubtitle}>
                Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc tòa nhà.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerTitleContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  summaryBar: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 2,
  },
  summaryText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  summaryHighlight: {
    fontWeight: '700',
    color: '#1E293B',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  separator: {
    height: 12,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 32,
  },
});

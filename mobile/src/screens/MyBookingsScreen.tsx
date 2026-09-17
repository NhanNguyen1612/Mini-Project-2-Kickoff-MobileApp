import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBookingsQuery, useCancelBookingMutation } from '../hooks/useBookingsQuery';
import { useBookingStore } from '../store/useBookingStore';
import { Booking } from '../types';

export const MyBookingsScreen: React.FC = () => {
  const { user } = useBookingStore();
  const { data: bookings, isLoading, isRefetching, refetch } = useBookingsQuery(user.studentId);
  const cancelMutation = useCancelBookingMutation();

  const handleCancelBooking = (booking: Booking) => {
    Alert.alert(
      'Xác nhận hủy lịch đặt phòng',
      `Bạn có chắc chắn muốn hủy đặt phòng ${booking.room_name || 'này'} vào ca ${booking.time_slot}, ngày ${booking.booking_date}?`,
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Đồng ý hủy',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelMutation.mutateAsync(booking.id);
              Alert.alert('Thành công', 'Lịch đặt phòng đã được hủy.');
            } catch (err: any) {
              Alert.alert('Lỗi', err.message || 'Không thể hủy lịch đặt phòng.');
            }
          },
        },
      ]
    );
  };

  const renderBookingItem = ({ item }: { item: Booking }) => {
    const isCancelled = item.status === 'cancelled';

    return (
      <View style={styles.bookingCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.roomName}>{item.room_name || 'Phòng học VKU'}</Text>
          <View
            style={[
              styles.statusBadge,
              isCancelled ? styles.statusCancelled : styles.statusConfirmed,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isCancelled ? styles.statusCancelledText : styles.statusConfirmedText,
              ]}
            >
              {isCancelled ? 'Đã hủy' : 'Đã xác nhận'}
            </Text>
          </View>
        </View>

        <Text style={styles.locationText}>📍 {item.building || 'Khuôn viên VKU'}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>🗓 Ngày:</Text>
          <Text style={styles.infoValue}>{item.booking_date}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>⏰ Ca học:</Text>
          <Text style={styles.infoValue}>{item.time_slot}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>🎯 Mục đích:</Text>
          <Text style={styles.infoValue}>{item.purpose || 'Học tập / Nghiên cứu'}</Text>
        </View>

        {!isCancelled && (
          <View style={styles.actionContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.cancelBtn,
                cancelMutation.isPending && styles.disabledBtn,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => handleCancelBooking(item)}
              hitSlop={8}
            >
              <Text style={styles.cancelBtnText}>Hủy đặt phòng</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Lịch Đặt Phòng Của Tôi</Text>
        <Text style={styles.subtitle}>
          Sinh viên: {user.fullName} ({user.studentId})
        </Text>
      </View>

      {isLoading && !isRefetching ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Đang tải lịch đặt phòng...</Text>
        </View>
      ) : (
        <FlatList
          data={bookings || []}
          keyExtractor={(item) => item.id}
          renderItem={renderBookingItem}
          contentContainerStyle={styles.listContent}
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
              <Text style={styles.emptyEmoji}>📅</Text>
              <Text style={styles.emptyTitle}>Chưa có lịch đặt phòng nào</Text>
              <Text style={styles.emptySubtitle}>
                Hãy qua tab "Browse Rooms" để chọn và đặt phòng học hoặc lab nhé!
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusConfirmed: {
    backgroundColor: '#ECFDF5',
  },
  statusCancelled: {
    backgroundColor: '#FEF2F2',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusConfirmedText: {
    color: '#059669',
  },
  statusCancelledText: {
    color: '#DC2626',
  },
  locationText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
    width: 80,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  actionContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'flex-end',
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B91C1C',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyEmoji: {
    fontSize: 48,
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

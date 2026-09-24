import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';

import { RootStackParamList } from '../types/navigation';
import { useBookingsQuery, useCancelBookingMutation } from '../hooks/useBookingsQuery';
import { useBookingStore } from '../store/useBookingStore';
import { Booking } from '../types';
import { apiService } from '../services/api';
import { QRCodeTicketModal } from '../components/QRCodeTicketModal';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const MyBookingsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useBookingStore();
  const { data: bookings, isLoading, isRefetching, refetch } = useBookingsQuery(user.studentId);
  const cancelMutation = useCancelBookingMutation();

  const [selectedBookingForQr, setSelectedBookingForQr] = useState<Booking | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const pendingOfflineList =
    bookings?.filter((b) => b.is_offline_pending && b.status === 'confirmed') || [];

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const { synced, conflicts, error } = await apiService.syncOfflineBookings();
      if (error) {
        Alert.alert(
          'Chưa thể kết nối',
          error
        );
      } else {
        if (conflicts.length > 0) {
          const msg = conflicts.map((c) => `• ${c.message}`).join('\n\n');
          Alert.alert(
            '⚠️ Phát hiện trùng lịch',
            `Các ca sau đây đã bị người khác đặt trước trong lúc bạn ngoại tuyến:\n\n${msg}\n\nCác ca này đã được tự động đánh dấu Hủy để tránh trùng lịch.`
          );
        }
        if (synced.length > 0) {
          Alert.alert(
            '✅ Đồng bộ thành công',
            `Đã đăng ký chính thức ${synced.length} phiếu đặt phòng lên hệ thống!`
          );
        }
      }
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi đồng bộ';
      Alert.alert('Lỗi', msg);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await apiService.syncOfflineBookings();
    } catch {
      // Ignored
    }
    refetch();
  };

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
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Không thể hủy lịch đặt phòng.';
              Alert.alert('Lỗi', msg);
            }
          },
        },
      ]
    );
  };

  const renderBookingItem = ({ item }: { item: Booking }) => {
    const isCancelled = item.status === 'cancelled';
    const isOffline = item.is_offline_pending;

    // Gesture Handler Swipe Actions
    const renderRightActions = () => (
      <View style={styles.swipeActionsContainer}>
        <Pressable
          style={styles.swipeQrBtn}
          onPress={() => setSelectedBookingForQr(item)}
        >
          <Text style={styles.swipeBtnText}>🎫 QR</Text>
        </Pressable>
        {!isCancelled && (
          <Pressable
            style={styles.swipeCancelBtn}
            onPress={() => handleCancelBooking(item)}
          >
            <Text style={styles.swipeBtnText}>🗑 Hủy</Text>
          </Pressable>
        )}
      </View>
    );

    return (
      <Animated.View
        entering={FadeIn.duration(180)}
      >
        <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
          <View style={styles.bookingCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.roomName}>{item.room_name || 'Phòng học VKU'}</Text>
              <View style={styles.statusBadgesGroup}>
                {isOffline && !isCancelled && (
                  <View style={styles.offlineBadge}>
                    <Text style={styles.offlineBadgeText}>⏳ Chờ xác nhận</Text>
                  </View>
                )}
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
                    {isCancelled ? 'Đã hủy' : isOffline ? 'Chờ đồng bộ' : 'Đã xác nhận'}
                  </Text>
                </View>
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

            {/* Action Row */}
            <View style={styles.actionContainer}>
              <Pressable
                style={({ pressed }) => [styles.qrBtn, pressed && { opacity: 0.8 }]}
                onPress={() => setSelectedBookingForQr(item)}
                hitSlop={6}
              >
                <Text style={styles.qrBtnText}>🎫 Thẻ QR</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.viewRoomBtn, pressed && { opacity: 0.7 }]}
                onPress={() => navigation.navigate('RoomDetail', { roomId: item.room_id })}
                hitSlop={6}
              >
                <Text style={styles.viewRoomBtnText}>Xem phòng →</Text>
              </Pressable>

              {!isCancelled && (
                <Pressable
                  style={({ pressed }) => [
                    styles.cancelBtn,
                    cancelMutation.isPending && styles.disabledBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => handleCancelBooking(item)}
                  hitSlop={6}
                >
                  <Text style={styles.cancelBtnText}>Hủy</Text>
                </Pressable>
              )}
            </View>
          </View>
        </Swipeable>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.title}>Lịch Đặt Phòng Của Tôi</Text>
          <Pressable
            style={({ pressed }) => [styles.syncIconBtn, pressed && { opacity: 0.7 }]}
            onPress={handleManualSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <Text style={styles.syncIconBtnText}>🔄 Đồng bộ</Text>
            )}
          </Pressable>
        </View>
        <Text style={styles.subtitle}>
          Sinh viên: {user.fullName} ({user.studentId})
        </Text>
      </View>

      {/* Offline Pending Warning Banner with Reanimated */}
      {pendingOfflineList.length > 0 && (
        <Animated.View entering={FadeIn.duration(180)} style={styles.syncBanner}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.syncBannerTitle}>
              ⚡ {pendingOfflineList.length} ca đặt phòng chưa đồng bộ
            </Text>
            <Text style={styles.syncBannerSubtitle}>
              Nhấn để kiểm tra trùng lịch và xác nhận chính thức.
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.syncBannerBtn, pressed && { opacity: 0.85 }]}
            onPress={handleManualSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.syncBannerBtnText}>Đồng bộ ngay</Text>
            )}
          </Pressable>
        </Animated.View>
      )}

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
              onRefresh={handleRefresh}
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

      {/* QR Code Ticket Modal for Check-in */}
      <QRCodeTicketModal
        booking={selectedBookingForQr}
        visible={!!selectedBookingForQr}
        onClose={() => setSelectedBookingForQr(null)}
      />
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
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  syncIconBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  syncIconBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  syncBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B45309',
  },
  syncBannerSubtitle: {
    fontSize: 11.5,
    color: '#92400E',
    marginTop: 2,
  },
  syncBannerBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  syncBannerBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
  statusBadgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  offlineBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#FEF3C7',
  },
  offlineBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
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
    color: '#1E293B',
    fontWeight: '600',
    flex: 1,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  qrBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#0F172A',
  },
  qrBtnText: {
    fontSize: 12.5,
    color: '#38BDF8',
    fontWeight: '700',
  },
  viewRoomBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  viewRoomBtnText: {
    fontSize: 12.5,
    color: '#2563EB',
    fontWeight: '600',
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  cancelBtnText: {
    fontSize: 12.5,
    color: '#DC2626',
    fontWeight: '600',
  },
  swipeActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
    paddingLeft: 8,
  },
  swipeQrBtn: {
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    width: 68,
    height: '100%',
    borderRadius: 12,
  },
  swipeCancelBtn: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 68,
    height: '100%',
    borderRadius: 12,
  },
  swipeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12.5,
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
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 18,
  },
});

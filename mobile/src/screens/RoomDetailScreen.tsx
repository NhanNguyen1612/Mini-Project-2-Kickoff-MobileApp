import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import type { RouteProp } from '@react-navigation/native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Booking } from '../types';
import { useRoomDetailQuery } from '../hooks/useRoomsQuery';
import { useCreateBookingMutation } from '../hooks/useBookingsQuery';
import { TimeSlotSelector } from '../components/TimeSlotSelector';
import { QRCodeTicketModal } from '../components/QRCodeTicketModal';
import { useBookingStore } from '../store/useBookingStore';

type RouteType = RouteProp<RootStackParamList, 'RoomDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ConfirmedBookingData {
  roomName: string;
  building: string;
  date: string;
  slot: string;
  studentId: string;
  fullName: string;
  id: string;
  isOfflinePending?: boolean;
}

export const RoomDetailScreen: React.FC = () => {
  const route = useRoute<RouteType>();
  const navigation = useNavigation<NavigationProp>();
  const { roomId } = route.params;

  // Selected date management (defaults to today)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [purpose, setPurpose] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<ConfirmedBookingData | null>(null);
  const [ticketBooking, setTicketBooking] = useState<Booking | null>(null);
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  // A short, subtle scale change avoids the modal bouncing into view.
  const scaleVal = useSharedValue(0.96);

  useEffect(() => {
    if (confirmedBooking) {
      scaleVal.value = withTiming(1, {
        duration: 180,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      scaleVal.value = 0.96;
    }
  }, [confirmedBooking, scaleVal]);

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleVal.value }],
  }));

  const { user } = useBookingStore();

  // Query room detail & availability from server or local mock
  const { data, isLoading } = useRoomDetailQuery(roomId, selectedDate);
  const createBookingMutation = useCreateBookingMutation();

  const handleBooking = async () => {
    if (!selectedSlot) {
      Alert.alert('Chưa chọn ca học', 'Vui lòng chọn một khung giờ còn trống để đặt phòng.');
      return;
    }

    try {
      const result = await createBookingMutation.mutateAsync({
        room_id: roomId,
        user_name: user.fullName,
        user_student_id: user.studentId,
        booking_date: selectedDate,
        time_slot: selectedSlot,
        purpose: purpose.trim() || 'Học tập & Nghiên cứu',
      });

      setTicketBooking(result);

      // Show animated celebration modal instead of basic alert (Slide 30 UI/UX)
      setConfirmedBooking({
        roomName: data?.room.name || 'Phòng học VKU',
        building: data?.room.building || 'Khuôn viên VKU',
        date: selectedDate,
        slot: selectedSlot,
        studentId: user.studentId,
        fullName: user.fullName,
        id: result?.id || `BK-${Date.now().toString().slice(-6)}`,
        isOfflinePending: result?.is_offline_pending,
      });

      setSelectedSlot(null);
      setPurpose('');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Khung giờ này đã bị trùng lịch!';
      // Conflict alert (Chống trùng lịch)
      Alert.alert('❌ Không thể đặt phòng', errorMessage);
    }
  };

  if (isLoading || !data) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Đang tải thông tin phòng học...</Text>
      </SafeAreaView>
    );
  }

  const { room, bookedSlots } = data;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Large Hero Image */}
        <Image
          source={{ uri: room.image_url }}
          style={styles.heroImage}
          contentFit="cover"
          transition={300}
        />

        <View style={styles.body}>
          {/* Title & Badges */}
          <View style={styles.titleRow}>
            <Text style={styles.roomName}>{room.name}</Text>
            <Text style={styles.badge}>{room.capacity} chỗ</Text>
          </View>

          <Text style={styles.location}>📍 {room.building}</Text>
          <Text style={styles.description}>{room.description}</Text>

          {/* Amenities List */}
          <View style={styles.amenitiesSection}>
            <Text style={styles.sectionHeader}>Trang thiết bị & Tiện ích:</Text>
            <View style={styles.amenitiesList}>
              {room.amenities.map((item, index) => (
                <View key={index} style={styles.amenityBadge}>
                  <Text style={styles.amenityText}>✨ {item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Date Selector: Đặt lịch trước 7 ngày (Slide 30) */}
          <View style={styles.dateSection}>
            <Text style={styles.sectionHeader}>Chọn ngày sử dụng phòng:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateSelectorScroll}
            >
              {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                const d = new Date();
                d.setDate(d.getDate() + offset);
                const dateStr = d.toISOString().split('T')[0];
                const dayName =
                  offset === 0
                    ? 'Hôm nay'
                    : offset === 1
                    ? 'Ngày mai'
                    : `Thứ ${d.getDay() === 0 ? 'CN' : d.getDay() + 1}`;
                const displayDate = `${d.getDate()}/${d.getMonth() + 1}`;
                const isSelected = selectedDate === dateStr;

                return (
                  <Pressable
                    key={dateStr}
                    style={({ pressed }) => [
                      styles.dateBtn,
                      isSelected && styles.dateBtnSelected,
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => {
                      setSelectedDate(dateStr);
                      setSelectedSlot(null);
                    }}
                    hitSlop={6}
                  >
                    <Text style={[styles.dateText, isSelected && styles.dateTextSelected]}>
                      {dayName}
                    </Text>
                    <Text style={[styles.dateSubtext, isSelected && styles.dateSubtextSelected]}>
                      {displayDate}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Time Slot Selector with Conflict Prevention & Expired Slot Detection (Slide 30) */}
          <TimeSlotSelector
            bookedSlots={bookedSlots || []}
            selectedSlot={selectedSlot}
            onSelectSlot={setSelectedSlot}
            selectedDate={selectedDate}
          />

          {/* Purpose Input */}
          <View style={styles.purposeSection}>
            <Text style={styles.sectionHeader}>Mục đích sử dụng:</Text>
            <TextInput
              style={styles.purposeInput}
              value={purpose}
              onChangeText={setPurpose}
              placeholder="VD: Họp nhóm đồ án Mobile App, nghiên cứu đề tài..."
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Student Info Card */}
          <View style={styles.userCard}>
            <Text style={styles.userCardTitle}>Thông tin người đặt:</Text>
            <Text style={styles.userCardText}>
              Sinh viên: <Text style={styles.bold}>{user.fullName}</Text> (MSSV: {user.studentId})
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button for Booking */}
      <View style={styles.bottomBar}>
        <Pressable
          style={({ pressed }) => [
            styles.bookButton,
            (!selectedSlot || createBookingMutation.isPending) && styles.bookButtonDisabled,
            pressed && { opacity: 0.8 },
          ]}
          disabled={!selectedSlot || createBookingMutation.isPending}
          onPress={handleBooking}
          hitSlop={8}
        >
          {createBookingMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.bookButtonText}>
              {selectedSlot ? `Xác nhận đặt ca ${selectedSlot}` : 'Vui lòng chọn ca học'}
            </Text>
          )}
        </Pressable>
      </View>

      {/* Slide 30 / Rubric UI/UX: Animated Celebration & Receipt Modal */}
      <Modal
        visible={!!confirmedBooking}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmedBooking(null)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, animatedModalStyle]}>
            {/* Header Badge */}
            <View style={styles.modalIconContainer}>
              <Text style={styles.modalIcon}>🎉</Text>
            </View>

            <Text style={styles.modalTitle}>
              {confirmedBooking?.isOfflinePending ? 'Đã lưu lịch chờ xác nhận' : 'Đặt Phòng Thành Công!'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {confirmedBooking?.isOfflinePending
                ? 'Lịch đã lưu trên thiết bị. Hãy đồng bộ khi kết nối lại để được xác nhận.'
                : 'Lịch đặt phòng đã được máy chủ xác nhận.'}
            </Text>

            {/* Ticket Receipt Box */}
            {confirmedBooking && (
              <View style={styles.ticketBox}>
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketLabel}>🏫 Phòng:</Text>
                  <Text style={styles.ticketValueBold}>{confirmedBooking.roomName}</Text>
                </View>
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketLabel}>📍 Tòa nhà:</Text>
                  <Text style={styles.ticketValue}>{confirmedBooking.building}</Text>
                </View>
                <View style={styles.ticketDivider} />
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketLabel}>🗓 Ngày đặt:</Text>
                  <Text style={styles.ticketValueBold}>{confirmedBooking.date}</Text>
                </View>
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketLabel}>⏰ Khung giờ:</Text>
                  <Text style={styles.ticketValueHighlight}>{confirmedBooking.slot}</Text>
                </View>
                <View style={styles.ticketDivider} />
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketLabel}>👤 Sinh viên:</Text>
                  <Text style={styles.ticketValue}>{confirmedBooking.fullName} ({confirmedBooking.studentId})</Text>
                </View>
                <View style={styles.ticketRow}>
                  <Text style={styles.ticketLabel}>🎫 Mã phiếu:</Text>
                  <Text style={styles.ticketCode}>#{confirmedBooking.id.slice(-6).toUpperCase()}</Text>
                </View>
                <View style={styles.ticketDivider} />
                <View style={[styles.ticketRow, { justifyContent: 'center', marginTop: 4 }]}>
                  <View
                    style={[
                      styles.syncStatusBadge,
                      confirmedBooking.isOfflinePending
                        ? styles.syncStatusBadgePending
                        : styles.syncStatusBadgeConfirmed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.syncStatusBadgeText,
                        confirmedBooking.isOfflinePending
                          ? styles.syncStatusBadgeTextPending
                          : styles.syncStatusBadgeTextConfirmed,
                      ]}
                    >
                      {confirmedBooking.isOfflinePending
                        ? '⏳ Lưu tạm Offline (Chờ mạng đồng bộ)'
                        : '✅ Máy chủ đã xác nhận'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [styles.qrModalBtn, pressed && { opacity: 0.85 }]}
                onPress={() => setShowQrModal(true)}
              >
                <Text style={styles.qrModalBtnText}>🎫 Xem Thẻ Vé QR Code</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.primaryModalBtn, pressed && { opacity: 0.85 }]}
                onPress={() => {
                  setConfirmedBooking(null);
                  navigation.navigate('MainTabs', { screen: 'MyBookings' });
                }}
              >
                <Text style={styles.primaryModalBtnText}>📅 Xem trong Lịch đặt phòng</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.secondaryModalBtn, pressed && { opacity: 0.7 }]}
                onPress={() => setConfirmedBooking(null)}
              >
                <Text style={styles.secondaryModalBtnText}>Đặt thêm ca khác</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* QR Code Ticket Modal */}
      <QRCodeTicketModal
        booking={ticketBooking}
        visible={showQrModal}
        onClose={() => setShowQrModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#E2E8F0',
  },
  body: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  location: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    marginTop: 10,
  },
  amenitiesSection: {
    marginTop: 16,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  amenitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  amenityText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  dateSection: {
    marginTop: 18,
  },
  dateSelectorScroll: {
    paddingVertical: 4,
    gap: 10,
  },
  dateBtn: {
    width: 80,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  dateBtnSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  dateTextSelected: {
    color: '#2563EB',
  },
  dateSubtext: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  dateSubtextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  purposeSection: {
    marginTop: 12,
  },
  purposeInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  userCard: {
    marginTop: 16,
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  userCardTitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
  },
  userCardText: {
    fontSize: 13,
    color: '#1E293B',
  },
  bold: {
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  bookButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalIcon: {
    fontSize: 32,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  ticketBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 8,
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketLabel: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
  },
  ticketValue: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
  },
  ticketValueBold: {
    fontSize: 13.5,
    color: '#0F172A',
    fontWeight: '700',
  },
  ticketValueHighlight: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '800',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ticketCode: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#64748B',
  },
  ticketDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 2,
  },
  modalActions: {
    width: '100%',
    marginTop: 20,
    gap: 10,
  },
  primaryModalBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryModalBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  secondaryModalBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryModalBtnText: {
    color: '#64748B',
    fontSize: 13.5,
    fontWeight: '600',
  },
  qrModalBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  qrModalBtnText: {
    color: '#38BDF8',
    fontSize: 14.5,
    fontWeight: '700',
  },
  syncStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  syncStatusBadgeConfirmed: {
    backgroundColor: '#ECFDF5',
  },
  syncStatusBadgePending: {
    backgroundColor: '#FFFBEB',
  },
  syncStatusBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  syncStatusBadgeTextConfirmed: {
    color: '#059669',
  },
  syncStatusBadgeTextPending: {
    color: '#D97706',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import type { RouteProp } from '@react-navigation/native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { useRoomDetailQuery } from '../hooks/useRoomsQuery';
import { useCreateBookingMutation } from '../hooks/useBookingsQuery';
import { TimeSlotSelector } from '../components/TimeSlotSelector';
import { useBookingStore } from '../store/useBookingStore';

type RouteType = RouteProp<RootStackParamList, 'RoomDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const RoomDetailScreen: React.FC = () => {
  const route = useRoute<RouteType>();
  const navigation = useNavigation<NavigationProp>();
  const { roomId } = route.params;

  // Selected date management (defaults to today)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [purpose, setPurpose] = useState('');

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
      await createBookingMutation.mutateAsync({
        room_id: roomId,
        user_name: user.fullName,
        user_student_id: user.studentId,
        booking_date: selectedDate,
        time_slot: selectedSlot,
        purpose: purpose.trim() || 'Học tập & Nghiên cứu',
      });

      Alert.alert(
        '🎉 Đặt phòng thành công!',
        `Bạn đã đặt thành công phòng ${data?.room.name} vào ca ${selectedSlot}, ngày ${selectedDate}.`,
        [
          {
            text: 'Xem lịch đặt phòng',
            onPress: () => {
              navigation.navigate('MainTabs', { screen: 'MyBookings' } as any);
            },
          },
        ]
      );
      setSelectedSlot(null);
    } catch (err: any) {
      // Conflict alert (Chống trùng lịch)
      Alert.alert('❌ Không thể đặt phòng', err.message || 'Khung giờ này đã bị trùng lịch!');
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
});

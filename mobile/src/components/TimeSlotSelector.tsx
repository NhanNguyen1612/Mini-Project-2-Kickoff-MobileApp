import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { STANDARD_TIME_SLOTS } from '../services/mockData';

interface TimeSlotSelectorProps {
  bookedSlots: string[];
  selectedSlot: string | null;
  onSelectSlot: (slot: string) => void;
  selectedDate?: string;
}

/**
 * Kiểm tra xem một ca học trong ngày hôm nay đã kết thúc hay chưa
 * Ví dụ: Ca '07:30 - 09:30' sẽ hết giờ khi qua 09:30
 */
function isSlotExpired(slot: string, selectedDate?: string): boolean {
  if (!selectedDate) return false;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Nếu là ngày trong quá khứ -> tất cả các ca đều hết giờ
  if (selectedDate < todayStr) return true;

  // Nếu là ngày mai hoặc các ngày trong tương lai -> không có ca nào hết giờ
  if (selectedDate > todayStr) return false;

  // Nếu là ngày hôm nay -> so sánh giờ kết thúc của ca học với giờ hiện tại
  try {
    const endTimeStr = slot.split(' - ')[1]?.trim(); // VD: "09:30"
    if (!endTimeStr) return false;

    const [endHour, endMinute] = endTimeStr.split(':').map(Number);
    const slotEndTime = new Date();
    slotEndTime.setHours(endHour, endMinute, 0, 0);

    return now.getTime() >= slotEndTime.getTime();
  } catch {
    return false;
  }
}

export const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  bookedSlots,
  selectedSlot,
  onSelectSlot,
  selectedDate,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chọn Khung Giờ (Ca học):</Text>
      <Text style={styles.subtitle}>
        * Ca đã hết giờ hoặc đã có người đặt sẽ bị khóa để chống trùng lịch
      </Text>

      <View style={styles.slotsGrid}>
        {STANDARD_TIME_SLOTS.map((slot) => {
          const isBooked = bookedSlots.includes(slot);
          const isExpired = isSlotExpired(slot, selectedDate);
          const isDisabled = isBooked || isExpired;
          const isSelected = selectedSlot === slot;

          return (
            <Pressable
              key={slot}
              disabled={isDisabled}
              onPress={() => onSelectSlot(slot)}
              style={({ pressed }) => [
                styles.slotButton,
                isDisabled && styles.slotBooked,
                isSelected && styles.slotSelected,
                pressed && !isDisabled && { opacity: 0.75 },
              ]}
              hitSlop={6}
            >
              <View style={styles.slotHeader}>
                <Text
                  style={[
                    styles.slotTime,
                    isDisabled && styles.slotTimeBooked,
                    isSelected && styles.slotTimeSelected,
                  ]}
                >
                  {slot}
                </Text>
                <View
                  style={[
                    styles.dot,
                    isExpired
                      ? styles.dotExpired
                      : isBooked
                      ? styles.dotBooked
                      : isSelected
                      ? styles.dotSelected
                      : styles.dotAvailable,
                  ]}
                />
              </View>

              <Text
                style={[
                  styles.slotStatus,
                  isExpired
                    ? styles.slotStatusExpired
                    : isBooked
                    ? styles.slotStatusBooked
                    : isSelected
                    ? styles.slotStatusSelected
                    : null,
                ]}
              >
                {isExpired
                  ? '⏰ Đã hết giờ'
                  : isBooked
                  ? '🚫 Đã có người đặt'
                  : isSelected
                  ? '✓ Đang chọn'
                  : 'Ca còn trống'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotButton: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  slotBooked: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.55,
  },
  slotSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  slotTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  slotTimeBooked: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  slotTimeSelected: {
    color: '#2563EB',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotAvailable: {
    backgroundColor: '#10B981',
  },
  dotBooked: {
    backgroundColor: '#EF4444',
  },
  dotExpired: {
    backgroundColor: '#94A3B8',
  },
  dotSelected: {
    backgroundColor: '#2563EB',
  },
  slotStatus: {
    fontSize: 11,
    fontWeight: '500',
    color: '#059669',
  },
  slotStatusBooked: {
    color: '#DC2626',
    fontWeight: '600',
  },
  slotStatusExpired: {
    color: '#64748B',
    fontWeight: '500',
  },
  slotStatusSelected: {
    color: '#2563EB',
    fontWeight: '700',
  },
});

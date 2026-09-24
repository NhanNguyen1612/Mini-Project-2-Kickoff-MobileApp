import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { Image } from 'expo-image';
import { Room } from '../types';

interface RoomCardProps {
  room: Room;
  onPress: () => void;
  width?: number;
}

const ROOM_TYPE_LABELS: Record<string, { label: string; icon: string; bg: string; color: string }> = {
  computer_lab: { label: 'Lab Máy Tính', icon: '💻', bg: '#EFF6FF', color: '#1D4ED8' },
  theory_room: { label: 'Phòng Lý Thuyết', icon: '📖', bg: '#F0FDF4', color: '#15803D' },
  meeting_room: { label: 'Phòng Hội Thảo', icon: '🎙️', bg: '#FAF5FF', color: '#7E22CE' },
  study_space: { label: 'Không Gian Mở', icon: '☕', bg: '#FFFBEB', color: '#B45309' },
};

export const RoomCard: React.FC<RoomCardProps> = React.memo(({ room, onPress, width }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.99,
      useNativeDriver: true,
      duration: 100,
      easing: Easing.out(Easing.quad),
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      duration: 120,
      easing: Easing.out(Easing.quad),
    }).start();
  };

  const typeMeta = ROOM_TYPE_LABELS[room.room_type] || {
    label: 'Phòng học',
    icon: '🏫',
    bg: '#F1F5F9',
    color: '#475569',
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, width ? { width } : undefined]}>
      <Pressable
        style={styles.card}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        hitSlop={8}
      >
        {/* Room Photo with expo-image (Slide 16) */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: room.image_url }}
            style={styles.image}
            contentFit="cover"
            transition={300}
            placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
          />
          {/* Room Type Floating Chip */}
          <View style={[styles.typeBadge, { backgroundColor: typeMeta.bg }]}>
            <Text style={[styles.typeBadgeText, { color: typeMeta.color }]}>
              {typeMeta.icon} {typeMeta.label}
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Header: Room Name & Capacity badge (Slide 14-15) */}
          <View style={styles.header}>
            <Text style={styles.roomName} numberOfLines={1}>
              {room.name}
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{room.capacity} chỗ</Text>
            </View>
          </View>

          {/* Location / Building */}
          <Text style={styles.location}>📍 {room.building}</Text>

          {/* Amenities Preview */}
          {room.amenities.length > 0 && (
            <View style={styles.amenitiesPreviewRow}>
              {room.amenities.slice(0, 2).map((amenity, idx) => (
                <View key={idx} style={styles.amenityMiniTag}>
                  <Text style={styles.amenityMiniTagText} numberOfLines={1}>
                    ✓ {amenity}
                  </Text>
                </View>
              ))}
              {room.amenities.length > 2 && (
                <Text style={styles.amenitiesMoreText}>+{room.amenities.length - 2}</Text>
              )}
            </View>
          )}

          {/* Status / Availability Indicator (Slide 29 wireframe) */}
          <View style={styles.footer}>
            <View
              style={[
                styles.statusIndicator,
                room.is_active ? styles.statusAvailable : styles.statusOccupied,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  room.is_active ? styles.statusDotAvailable : styles.statusDotOccupied,
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  room.is_active ? styles.statusTextAvailable : styles.statusTextOccupied,
                ]}
              >
                {room.is_active ? 'Sẵn sàng đặt' : 'Đang bận'}
              </Text>
            </View>

            <Text style={styles.detailLink}>Xem ca & đặt →</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 145,
    backgroundColor: '#E2E8F0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  typeBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  badge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  location: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  amenitiesPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  amenityMiniTag: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    maxWidth: '46%',
  },
  amenityMiniTagText: {
    fontSize: 10.5,
    color: '#475569',
  },
  amenitiesMoreText: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    gap: 5,
  },
  statusAvailable: {
    backgroundColor: '#ECFDF5',
  },
  statusOccupied: {
    backgroundColor: '#FEF2F2',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusDotAvailable: {
    backgroundColor: '#10B981',
  },
  statusDotOccupied: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  statusTextAvailable: {
    color: '#059669',
  },
  statusTextOccupied: {
    color: '#DC2626',
  },
  detailLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
});

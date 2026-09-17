import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Room } from '../types';

interface RoomCardProps {
  room: Room;
  onPress: () => void;
  width?: number;
}

export const RoomCard: React.FC<RoomCardProps> = React.memo(({ room, onPress, width }) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        width ? { width } : undefined,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      hitSlop={8}
    >
      {/* Room Photo with expo-image (Slide 16) */}
      <Image
        source={{ uri: room.image_url }}
        style={styles.image}
        contentFit="cover"
        transition={300}
        placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
      />

      <View style={styles.content}>
        {/* Header: Room Name & Capacity badge (Slide 14-15) */}
        <View style={styles.header}>
          <Text style={styles.roomName} numberOfLines={1}>
            {room.name}
          </Text>
          <Text style={styles.badge}>{room.capacity} seats</Text>
        </View>

        {/* Location / Building */}
        <Text style={styles.location}>📍 {room.building}</Text>

        {/* Status / Availability Indicator (Slide 29 wireframe) */}
        <View style={styles.footer}>
          <View
            style={[
              styles.statusIndicator,
              room.is_active ? styles.statusAvailable : styles.statusOccupied,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                room.is_active ? styles.statusTextAvailable : styles.statusTextOccupied,
              ]}
            >
              {room.is_active ? '✅ Available' : '🔴 Occupied'}
            </Text>
          </View>

          <Text style={styles.amenityCount}>
            {room.amenities.length} tiện ích
          </Text>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 14,
  },
  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.99 }],
  },
  image: {
    width: '100%',
    height: 140,
    backgroundColor: '#E2E8F0',
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
    color: '#1E293B',
    flex: 1,
  },
  badge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  location: {
    marginTop: 6,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusAvailable: {
    backgroundColor: '#ECFDF5',
  },
  statusOccupied: {
    backgroundColor: '#FEF2F2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextAvailable: {
    color: '#059669',
  },
  statusTextOccupied: {
    color: '#DC2626',
  },
  amenityCount: {
    fontSize: 11,
    color: '#94A3B8',
  },
});

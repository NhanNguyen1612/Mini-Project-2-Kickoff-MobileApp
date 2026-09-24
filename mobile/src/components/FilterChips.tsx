import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { BUILDINGS_LIST } from '../services/mockData';

interface FilterChipsProps {
  selectedBuilding: string;
  onSelectBuilding: (building: string) => void;
  selectedCapacity: number;
  onSelectCapacity: (capacity: number) => void;
  selectedRoomType?: string;
  onSelectRoomType?: (type: string) => void;
  onResetFilters?: () => void;
}

const ROOM_TYPES = [
  { label: 'Tất cả loại phòng', value: 'all' },
  { label: '💻 Lab Máy Tính', value: 'computer_lab' },
  { label: '📖 Phòng Lý Thuyết', value: 'theory_room' },
  { label: '🎙️ Phòng Hội Thảo', value: 'meeting_room' },
  { label: '☕ Không Gian Tự Học', value: 'study_space' },
];

const CAPACITY_OPTIONS = [
  { label: 'Tất cả chỗ', value: 0 },
  { label: '≥ 20 chỗ', value: 20 },
  { label: '≥ 35 chỗ', value: 35 },
  { label: '≥ 60 chỗ', value: 60 },
  { label: '≥ 100 chỗ', value: 100 },
];

export const FilterChips: React.FC<FilterChipsProps> = ({
  selectedBuilding,
  onSelectBuilding,
  selectedCapacity,
  onSelectCapacity,
  selectedRoomType = 'all',
  onSelectRoomType,
  onResetFilters,
}) => {
  // Calculate active filter count
  let activeCount = 0;
  if (selectedBuilding && selectedBuilding !== 'Tất cả') activeCount++;
  if (selectedCapacity > 0) activeCount++;
  if (selectedRoomType && selectedRoomType !== 'all') activeCount++;

  return (
    <View style={styles.container}>
      {/* Active Filter Indicators & Reset Button (Slide 30) */}
      {activeCount > 0 && onResetFilters && (
        <View style={styles.activeFilterRow}>
          <View style={styles.activeCountBadge}>
            <Text style={styles.activeCountText}>Đang lọc: {activeCount}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.resetButton, pressed && { opacity: 0.7 }]}
            onPress={onResetFilters}
            hitSlop={6}
          >
            <Text style={styles.resetButtonText}>✕ Xóa tất cả bộ lọc</Text>
          </Pressable>
        </View>
      )}

      {/* Row 1: Room Type Quick Chips */}
      {onSelectRoomType && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {ROOM_TYPES.map((type) => {
            const isSelected = selectedRoomType === type.value;
            return (
              <Pressable
                key={type.value}
                style={({ pressed }) => [
                  styles.chip,
                  isSelected && styles.chipPrimaryActive,
                  pressed && { opacity: 0.75 },
                ]}
                onPress={() => onSelectRoomType(type.value)}
                hitSlop={6}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected && styles.chipPrimaryTextActive,
                  ]}
                >
                  {type.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Row 2: Building Selection */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: 6 }]}
      >
        {BUILDINGS_LIST.map((building) => {
          const isSelected = selectedBuilding === building;
          return (
            <Pressable
              key={building}
              style={({ pressed }) => [
                styles.chip,
                isSelected && styles.chipSecondaryActive,
                pressed && { opacity: 0.75 },
              ]}
              onPress={() => onSelectBuilding(building)}
              hitSlop={6}
            >
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipSecondaryTextActive,
                ]}
              >
                🏢 {building}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Row 3: Capacity Quick Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: 6 }]}
      >
        {CAPACITY_OPTIONS.map((opt) => {
          const isSelected = selectedCapacity === opt.value;
          return (
            <Pressable
              key={opt.value}
              style={({ pressed }) => [
                styles.smallChip,
                isSelected && styles.smallChipActive,
                pressed && { opacity: 0.75 },
              ]}
              onPress={() => onSelectCapacity(opt.value)}
              hitSlop={6}
            >
              <Text style={[styles.smallChipText, isSelected && styles.smallChipTextActive]}>
                👥 {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 8,
  },
  activeFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  activeCountBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  activeCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  resetButton: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipPrimaryActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  chipPrimaryTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  chipSecondaryActive: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  chipSecondaryTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },
  smallChip: {
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  smallChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  smallChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
  },
  smallChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

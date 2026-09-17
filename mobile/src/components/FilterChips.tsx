import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { BUILDINGS_LIST } from '../services/mockData';

interface FilterChipsProps {
  selectedBuilding: string;
  onSelectBuilding: (building: string) => void;
  selectedCapacity: number;
  onSelectCapacity: (capacity: number) => void;
}

const CAPACITY_OPTIONS = [
  { label: 'Tất cả sức chứa', value: 0 },
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
}) => {
  return (
    <View style={styles.container}>
      {/* Buildings Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {BUILDINGS_LIST.map((building) => {
          const isSelected = selectedBuilding === building;
          return (
            <Pressable
              key={building}
              style={({ pressed }) => [
                styles.chip,
                isSelected && styles.chipActive,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => onSelectBuilding(building)}
              hitSlop={6}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                {building}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Capacity Quick Filters */}
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
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => onSelectCapacity(opt.value)}
              hitSlop={6}
            >
              <Text style={[styles.smallChipText, isSelected && styles.smallChipTextActive]}>
                {opt.label}
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
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#1E3A5F',
    borderColor: '#1E3A5F',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  smallChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  smallChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
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

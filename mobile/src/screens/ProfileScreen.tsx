import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBookingStore } from '../store/useBookingStore';

/**
 * Profile Screen (Slide 29 Bottom Tabs: Browse Rooms | My Bookings | Profile)
 * Hiển thị thông tin sinh viên VKU thực hiện đồ án
 */
export const ProfileScreen: React.FC = () => {
  const { user, setUser } = useBookingStore();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar & Sinh Viên Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.fullName.split(' ').slice(-1)[0][0]}
            </Text>
          </View>
          <Text style={styles.name}>{user.fullName}</Text>
          <Text style={styles.mssv}>MSSV: {user.studentId}</Text>
          <Text style={styles.dept}>{user.department}</Text>
        </View>

        {/* Thông tin sinh viên */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin sinh viên</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Họ và tên</Text>
              <TextInput
                style={styles.editableValue}
                value={user.fullName}
                onChangeText={(t) => setUser({ fullName: t })}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.label}>Mã sinh viên</Text>
              <TextInput
                style={styles.editableValue}
                value={user.studentId}
                onChangeText={(t) => setUser({ studentId: t })}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.label}>Email VKU</Text>
              <Text style={styles.value}>{user.email}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.label}>Chuyên ngành</Text>
              <Text style={styles.value}>{user.department}</Text>
            </View>
          </View>
        </View>

        {/* Kiến trúc ứng dụng theo Slide Week 5 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin đồ án Mini-Project 2</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Môn học:</Text>
              <Text style={styles.infoVal}>Cross-Platform Mobile App Dev</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Giảng viên:</Text>
              <Text style={styles.infoVal}>Nguyen Thanh Tuan, PhD</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Kiến trúc:</Text>
              <Text style={styles.infoVal}>Expo Managed + React Native</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Dữ liệu:</Text>
              <Text style={styles.infoVal}>24 Phòng học & Lab VKU (Mock)</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>State Management:</Text>
              <Text style={styles.infoVal}>Zustand (Client) + TanStack Query</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.infoFooter}>
          <Text style={styles.footerText}>
            VKU Cross-Platform Mobile App - Week 5 Mini-Project 2
          </Text>
          <Text style={styles.footerSubtext}>
            © 2026 Vietnam - Korea University of Information and Communication Technology
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  mssv: {
    fontSize: 13,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 2,
  },
  dept: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  label: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  editableValue: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
    textAlign: 'right',
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoKey: {
    fontSize: 13,
    color: '#64748B',
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  infoFooter: {
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    textAlign: 'center',
  },
  footerSubtext: {
    fontSize: 10,
    color: '#CBD5E1',
    marginTop: 4,
    textAlign: 'center',
  },
});

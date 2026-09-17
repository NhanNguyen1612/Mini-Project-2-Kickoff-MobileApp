import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBookingStore } from '../store/useBookingStore';

/**
 * Profile Screen (Slide 29 Bottom Tabs: Browse Rooms | My Bookings | Profile)
 * Cho phép xem và chỉnh sửa thông tin sinh viên VKU (Họ tên, MSSV, Email, Chuyên ngành)
 */
export const ProfileScreen: React.FC = () => {
  const { user, setUser, logout } = useBookingStore();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user.fullName);
  const [studentId, setStudentId] = useState(user.studentId);
  const [email, setEmail] = useState(user.email);
  const [department, setDepartment] = useState(user.department);

  const handleSave = () => {
    if (!fullName.trim() || !studentId.trim()) {
      Alert.alert('Thiếu thông tin', 'Họ tên và Mã sinh viên không được để trống.');
      return;
    }

    setUser({
      fullName: fullName.trim(),
      studentId: studentId.trim(),
      email: email.trim(),
      department: department.trim(),
    });

    setIsEditing(false);
    Alert.alert('Thành công', 'Thông tin sinh viên đã được cập nhật!');
  };

  const handleCancel = () => {
    // Khôi phục lại dữ liệu ban đầu
    setFullName(user.fullName);
    setStudentId(user.studentId);
    setEmail(user.email);
    setDepartment(user.department);
    setIsEditing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar & Sinh Viên Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.fullName.trim().split(' ').slice(-1)[0]?.[0] || 'U'}
            </Text>
          </View>
          <Text style={styles.name}>{user.fullName}</Text>
          <Text style={styles.mssv}>MSSV: {user.studentId}</Text>
          <Text style={styles.dept}>{user.department}</Text>
        </View>

        {/* Thông tin sinh viên & Nút chỉnh sửa */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Thông tin sinh viên</Text>
            {!isEditing ? (
              <Pressable
                style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.7 }]}
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.editBtnText}>✏️ Chỉnh sửa</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.card}>
            {/* Họ và tên */}
            <View style={styles.row}>
              <Text style={styles.label}>Họ và tên</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Nhập họ và tên"
                />
              ) : (
                <Text style={styles.value}>{user.fullName}</Text>
              )}
            </View>
            <View style={styles.divider} />

            {/* Mã sinh viên */}
            <View style={styles.row}>
              <Text style={styles.label}>Mã sinh viên</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={studentId}
                  onChangeText={setStudentId}
                  placeholder="VD: 22IT001"
                />
              ) : (
                <Text style={styles.value}>{user.studentId}</Text>
              )}
            </View>
            <View style={styles.divider} />

            {/* Email VKU */}
            <View style={styles.row}>
              <Text style={styles.label}>Email VKU</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="VD: annv.22it@vku.udn.vn"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <Text style={styles.value}>{user.email}</Text>
              )}
            </View>
            <View style={styles.divider} />

            {/* Chuyên ngành / Khoa */}
            <View style={styles.row}>
              <Text style={styles.label}>Chuyên ngành</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={department}
                  onChangeText={setDepartment}
                  placeholder="VD: Khoa Công nghệ Thông tin"
                />
              ) : (
                <Text style={styles.value}>{user.department}</Text>
              )}
            </View>
          </View>

          {/* Các nút bấm khi ở chế độ chỉnh sửa */}
          {isEditing && (
            <View style={styles.actionBtnRow}>
              <Pressable
                style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelBtnText}>Hủy bỏ</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.7 }]}
                onPress={handleSave}
              >
                <Text style={styles.saveBtnText}>Lưu thông tin</Text>
              </Pressable>
            </View>
          )}
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

        {/* Nút Đăng Xuất (Logout) */}
        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]}
          onPress={() => {
            Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất tài khoản này không?', [
              { text: 'Hủy', style: 'cancel' },
              {
                text: 'Đăng xuất',
                style: 'destructive',
                onPress: () => logout(),
              },
            ]);
          }}
        >
          <Text style={styles.logoutBtnText}>🚪 Đăng Xuất Khỏi Tài Khoản</Text>
        </Pressable>

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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
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
    paddingVertical: 12,
  },
  label: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    width: 100,
  },
  value: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  input: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
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
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  logoutBtnText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
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

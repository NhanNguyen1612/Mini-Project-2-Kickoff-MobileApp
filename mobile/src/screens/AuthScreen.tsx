import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBookingStore } from '../store/useBookingStore';

interface AuthScreenProps {
  onSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Form states
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Khoa Công nghệ Thông tin');

  const { login, register } = useBookingStore();

  const handleAuth = () => {
    if (!studentId.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập Mã số sinh viên (MSSV).');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập Mật khẩu.');
      return;
    }

    if (mode === 'login') {
      const ok = login(studentId, password);
      if (ok) {
        Alert.alert('Thành công', `Chào mừng bạn quay trở lại!`);
        onSuccess?.();
      } else {
        Alert.alert(
          'Đăng nhập thất bại',
          'Mã sinh viên hoặc mật khẩu không chính xác.\n(Tài khoản mẫu: 22IT001 / mật khẩu: 123)'
        );
      }
    } else {
      if (!fullName.trim()) {
        Alert.alert('Lỗi', 'Vui lòng nhập Họ và tên.');
        return;
      }
      const res = register({
        studentId: studentId.trim(),
        fullName: fullName.trim(),
        email: email.trim() || `${studentId.toLowerCase()}@vku.udn.vn`,
        department: department.trim() || 'Khoa Công nghệ Thông tin',
        password: password.trim(),
      });

      if (res.success) {
        Alert.alert('🎉 Đăng ký thành công', `Tài khoản ${studentId.toUpperCase()} đã được tạo!`);
        onSuccess?.();
      } else {
        Alert.alert('Lỗi', res.message || 'Không thể đăng ký tài khoản.');
      }
    }
  };

  const fillDemoAccount = () => {
    setStudentId('22IT001');
    setPassword('123');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Brand Header */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoIcon}>🏫</Text>
            </View>
            <Text style={styles.appTitle}>VKU Room Booking</Text>
            <Text style={styles.appSubtitle}>
              Hệ thống Đặt Phòng Học & Lab Sinh Viên VKU
            </Text>
          </View>

          {/* Mode Switch Tabs */}
          <View style={styles.tabContainer}>
            <Pressable
              style={[styles.tabBtn, mode === 'login' && styles.tabBtnActive]}
              onPress={() => setMode('login')}
            >
              <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
                Đăng Nhập
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tabBtn, mode === 'register' && styles.tabBtnActive]}
              onPress={() => setMode('register')}
            >
              <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>
                Đăng Ký Mới
              </Text>
            </Pressable>
          </View>

          {/* Form Fields Card */}
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Mã số sinh viên (MSSV):</Text>
            <TextInput
              style={styles.input}
              value={studentId}
              onChangeText={setStudentId}
              placeholder="VD: 22IT001 hoặc 23IT123"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
            />

            {mode === 'register' && (
              <>
                <Text style={styles.fieldLabel}>Họ và tên đầy đủ:</Text>
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="VD: Lê Thị Hồng"
                  placeholderTextColor="#94A3B8"
                />

                <Text style={styles.fieldLabel}>Email trường VKU:</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="VD: honglt.22it@vku.udn.vn"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Text style={styles.fieldLabel}>Khoa / Chuyên ngành:</Text>
                <TextInput
                  style={styles.input}
                  value={department}
                  onChangeText={setDepartment}
                  placeholder="VD: Khoa Công nghệ Thông tin"
                  placeholderTextColor="#94A3B8"
                />
              </>
            )}

            <Text style={styles.fieldLabel}>Mật khẩu:</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Nhập mật khẩu"
              placeholderTextColor="#94A3B8"
              secureTextEntry
            />

            {/* Submit Button */}
            <Pressable
              style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.8 }]}
              onPress={handleAuth}
            >
              <Text style={styles.submitBtnText}>
                {mode === 'login' ? 'Đăng Nhập Vào Ứng Dụng' : 'Tạo Tài Khoản Sinh Viên'}
              </Text>
            </Pressable>

            {/* Quick Demo Fill (Hỗ trợ chấm điểm nhanh) */}
            {mode === 'login' && (
              <Pressable style={styles.demoFillBtn} onPress={fillDemoAccount}>
                <Text style={styles.demoFillText}>
                  💡 Điền nhanh tài khoản mẫu (22IT001 / 123)
                </Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  logoIcon: {
    fontSize: 32,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E3A5F',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#0F172A',
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 22,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  demoFillBtn: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 6,
  },
  demoFillText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
});

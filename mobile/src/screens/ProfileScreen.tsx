import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Switch,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBookingStore } from '../store/useBookingStore';
import { useQueryClient } from '@tanstack/react-query';

export const ProfileScreen: React.FC = () => {
  const {
    user,
    setUser,
    apiUrl,
    setApiUrl,
    isOfflineMode,
    setIsOfflineMode,
  } = useBookingStore();

  const queryClient = useQueryClient();

  const [inputUrl, setInputUrl] = useState(apiUrl);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);

  const handleSaveUrl = () => {
    setApiUrl(inputUrl.trim());
    queryClient.invalidateQueries();
    Alert.alert('Đã lưu cấu hình', 'Địa chỉ API Server đã được cập nhật.');
  };

  const handleTestConnection = async () => {
    const url = inputUrl.trim();
    if (!url) {
      Alert.alert('Chưa nhập URL', 'Vui lòng nhập URL của Cloudflare Worker.');
      return;
    }

    setTesting(true);
    setConnectionStatus(null);
    try {
      const res = await fetch(`${url}/api/rooms`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const json = await res.json();
        setConnectionStatus(`✅ Kết nối thành công! Đã tìm thấy ${json.total || 0} phòng học.`);
        setApiUrl(url);
        setIsOfflineMode(false);
        queryClient.invalidateQueries();
      } else {
        setConnectionStatus(`⚠️ Server phản hồi mã lỗi: ${res.status}`);
      }
    } catch (err: any) {
      setConnectionStatus(`❌ Không thể kết nối: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  const setLocalhostPreset = () => {
    // 10.0.2.2 is standard Android emulator host alias, localhost for iOS/web
    setInputUrl('http://10.0.2.2:8787');
  };

  const setMockPreset = () => {
    setInputUrl('');
    setApiUrl('');
    setIsOfflineMode(true);
    setConnectionStatus('ℹ️ Đã chuyển sang chế độ Mock Data Offline 100%.');
    queryClient.invalidateQueries();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
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

        {/* Student Info Card */}
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
          </View>
        </View>

        {/* Cloudflare Worker & D1 Connection Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Cấu hình Máy chủ Cloudflare</Text>
            <Text style={styles.badgeBonus}>Phần Mở Rộng</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Chế độ Mock Data Offline</Text>
                <Text style={styles.switchSublabel}>
                  Chạy hoàn toàn cục bộ với 24 phòng học mẫu không cần mạng
                </Text>
              </View>
              <Switch
                value={isOfflineMode}
                onValueChange={(val) => {
                  setIsOfflineMode(val);
                  queryClient.invalidateQueries();
                }}
                trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
                thumbColor={isOfflineMode ? '#2563EB' : '#F8FAFC'}
              />
            </View>

            <View style={styles.divider} />

            <Text style={styles.inputLabel}>URL Cloudflare Worker API:</Text>
            <TextInput
              style={styles.urlInput}
              value={inputUrl}
              onChangeText={setInputUrl}
              placeholder="https://vku-room-booking-api.<subdomain>.workers.dev"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Status Feedback */}
            {connectionStatus && (
              <View style={styles.statusBox}>
                <Text style={styles.statusText}>{connectionStatus}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.btnRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.actionBtn,
                  styles.saveBtn,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={handleSaveUrl}
                hitSlop={6}
              >
                <Text style={styles.saveBtnText}>Lưu cấu hình</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.actionBtn,
                  styles.testBtn,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={handleTestConnection}
                disabled={testing}
                hitSlop={6}
              >
                {testing ? (
                  <ActivityIndicator size="small" color="#2563EB" />
                ) : (
                  <Text style={styles.testBtnText}>Kiểm tra kết nối</Text>
                )}
              </Pressable>
            </View>

            {/* Quick Presets */}
            <View style={styles.presetContainer}>
              <Text style={styles.presetTitle}>Cấu hình nhanh mẫu:</Text>
              <View style={styles.presetRow}>
                <Pressable
                  style={styles.presetBtn}
                  onPress={setMockPreset}
                  hitSlop={4}
                >
                  <Text style={styles.presetBtnText}>📱 Dùng Mock Data</Text>
                </Pressable>
                <Pressable
                  style={styles.presetBtn}
                  onPress={setLocalhostPreset}
                  hitSlop={4}
                >
                  <Text style={styles.presetBtnText}>💻 Dùng Localhost (8787)</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* Tech Stack Info */}
        <View style={styles.infoFooter}>
          <Text style={styles.footerText}>
            VKU Cross-Platform Mobile App - Week 5 Mini-Project 2
          </Text>
          <Text style={styles.footerSubtext}>
            Expo Managed • TanStack Query • Zustand • Cloudflare D1
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
    paddingVertical: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#1E3A5F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  mssv: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
    marginTop: 2,
  },
  dept: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  badgeBonus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: {
    fontSize: 13,
    color: '#64748B',
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  editableValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
    textAlign: 'right',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingVertical: 2,
    minWidth: 140,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  switchSublabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  urlInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  statusBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusText: {
    fontSize: 12,
    color: '#334155',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    backgroundColor: '#1E3A5F',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  testBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  testBtnText: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 13,
  },
  presetContainer: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  presetTitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  presetBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  infoFooter: {
    alignItems: 'center',
    marginTop: 10,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  footerSubtext: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 2,
  },
});

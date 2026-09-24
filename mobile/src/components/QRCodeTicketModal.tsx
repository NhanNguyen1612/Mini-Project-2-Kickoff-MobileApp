import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Booking } from '../types';

interface QRCodeTicketModalProps {
  booking: Booking | null;
  visible: boolean;
  onClose: () => void;
}

export const QRCodeTicketModal: React.FC<QRCodeTicketModalProps> = ({
  booking,
  visible,
  onClose,
}) => {
  if (!booking) return null;

  // Dữ liệu mã hóa trong QR Code để quản lý phòng quét xác thực
  const qrData = JSON.stringify({
    type: 'VKU_ROOM_TICKET',
    ticketId: booking.id,
    room: booking.room_name,
    date: booking.booking_date,
    slot: booking.time_slot,
    studentId: booking.user_student_id,
    name: booking.user_name,
  });

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(
    qrData
  )}`;

  const isPendingSync = booking.is_offline_pending;
  const isCancelled = booking.status === 'cancelled';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.ticketCard}>
          {/* Header Ticket Punch Visual */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>🏫 VKU</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                isCancelled
                  ? styles.statusCancelled
                  : isPendingSync
                  ? styles.statusPending
                  : styles.statusConfirmed,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  isCancelled
                    ? styles.statusCancelledText
                    : isPendingSync
                    ? styles.statusPendingText
                    : styles.statusConfirmedText,
                ]}
              >
                {isCancelled
                  ? 'Đã hủy'
                  : isPendingSync
                  ? '⏳ Chờ máy chủ xác nhận'
                  : '✅ Đã xác nhận'}
              </Text>
            </View>
          </View>

          <Text style={styles.roomName}>{booking.room_name || 'Phòng học VKU'}</Text>
          <Text style={styles.buildingText}>📍 {booking.building || 'Khuôn viên VKU'}</Text>

          {/* QR Code Container with Scanner Frame */}
          <View style={styles.qrContainer}>
            <View style={styles.qrFrame}>
              <Image
                source={{ uri: qrImageUrl }}
                style={styles.qrImage}
                contentFit="contain"
                transition={200}
                placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
              />
            </View>
            <Text style={styles.qrInstruction}>
              Đưa mã QR này cho quản trị viên / bảo vệ quét xác nhận
            </Text>
          </View>

          {/* Info Details List */}
          <View style={styles.detailsBox}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>🗓 Ngày sử dụng:</Text>
              <Text style={styles.detailValueBold}>{booking.booking_date}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>⏰ Khung giờ:</Text>
              <Text style={styles.detailValueHighlight}>{booking.time_slot}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>👤 Sinh viên:</Text>
              <Text style={styles.detailValue}>
                {booking.user_name} ({booking.user_student_id})
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>🎫 Mã phiếu:</Text>
              <Text style={styles.detailCode}>#{booking.id.slice(-8).toUpperCase()}</Text>
            </View>
          </View>

          {/* Close Button */}
          <Pressable
            style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.85 }]}
            onPress={onClose}
          >
            <Text style={styles.closeBtnText}>Đóng thẻ vé</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  ticketCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  logoBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  logoText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusConfirmed: {
    backgroundColor: '#ECFDF5',
  },
  statusConfirmedText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },
  statusPending: {
    backgroundColor: '#FFFBEB',
  },
  statusPendingText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '700',
  },
  statusCancelled: {
    backgroundColor: '#FEF2F2',
  },
  statusCancelledText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
  },
  roomName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  buildingText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 16,
    textAlign: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrFrame: {
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  qrImage: {
    width: 180,
    height: 180,
  },
  qrInstruction: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'center',
  },
  detailsBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 7,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12.5,
    color: '#1E293B',
    fontWeight: '500',
  },
  detailValueBold: {
    fontSize: 12.5,
    color: '#0F172A',
    fontWeight: '700',
  },
  detailValueHighlight: {
    fontSize: 12.5,
    color: '#2563EB',
    fontWeight: '800',
  },
  detailCode: {
    fontSize: 11.5,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#64748B',
  },
  closeBtn: {
    width: '100%',
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

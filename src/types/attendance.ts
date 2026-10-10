export type AttendanceType = 'masuk' | 'pulang';

export type AttendanceStatus = 'tepat_waktu' | 'terlambat' | 'izin' | 'sakit' | 'alpa';

export type AttendanceMethod = 'qr_scan' | 'manual' | 'kartu_digital';

export interface Student {
  id: string;
  nisn: string;
  nis: string;
  name: string;
  class: string;
  gender: 'L' | 'P';
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  avatarUrl: string;
  status: 'aktif' | 'non-aktif';
  qrCodeData: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentNisn: string;
  class: string;
  timestamp: string; // ISO string
  date: string; // YYYY-MM-DD
  timeStr: string; // HH:mm:ss
  type: AttendanceType;
  status: AttendanceStatus;
  method: AttendanceMethod;
  note?: string;
  parentNotified: boolean;
  notifiedAt?: string;
  notificationChannel: 'whatsapp' | 'sms';
  whatsappMessageSent?: string;
}

export interface NotificationLog {
  id: string;
  attendanceId: string;
  studentId: string;
  studentName: string;
  parentName: string;
  parentPhone: string;
  message: string;
  timestamp: string;
  timeStr: string;
  status: 'terkirim' | 'pending' | 'gagal';
  channel: 'whatsapp' | 'sms';
  type: AttendanceType | 'izin';
}

export interface LeaveRequest {
  id: string;
  studentId: string;
  studentName: string;
  class: string;
  dateStart: string;
  dateEnd: string;
  type: 'izin' | 'sakit';
  reason: string;
  parentName: string;
  parentPhone: string;
  submittedAt: string;
  status: 'disetujui' | 'menunggu' | 'ditolak';
  attachmentName?: string;
}

export interface SchoolSettings {
  schoolName: string;
  schoolNPSN: string;
  address: string;
  academicYear: string;
  semester: string;
  checkInStart: string; // e.g. "06:30"
  checkInStandard: string; // e.g. "07:00"
  lateThreshold: string; // e.g. "07:15"
  checkOutStart: string; // e.g. "14:00"
  autoNotifyWhatsApp: boolean;
  soundBeepEnabled: boolean;
  cameraFacingMode: 'user' | 'environment';
  whatsappTemplates: {
    masukTepatWaktu: string;
    masukTerlambat: string;
    pulang: string;
    izin: string;
  };
}

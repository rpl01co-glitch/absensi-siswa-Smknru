import { Student, AttendanceRecord, SchoolSettings } from '../types/attendance';

export function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

export function formatWhatsAppMessage(
  template: string,
  student: Student,
  record: Pick<AttendanceRecord, 'type' | 'status' | 'timeStr' | 'date'>,
  settings: SchoolSettings
): string {
  const statusLabel =
    record.status === 'tepat_waktu'
      ? 'Hadir Tepat Waktu'
      : record.status === 'terlambat'
      ? 'Terlambat Masuk'
      : record.status === 'izin'
      ? 'Izin'
      : record.status === 'sakit'
      ? 'Sakit'
      : 'Alpa';

  const typeLabel = record.type === 'masuk' ? 'Presensi Masuk Sekolah' : 'Presensi Pulang Sekolah';

  const replacements: Record<string, string> = {
    '{nama}': student.name,
    '{nisn}': student.nisn,
    '{kelas}': student.class,
    '{wali}': student.parentName,
    '{jam}': record.timeStr,
    '{tanggal}': record.date,
    '{status}': statusLabel,
    '{tipe}': typeLabel,
    '{sekolah}': settings.schoolName,
  };

  let message = template;
  for (const [key, val] of Object.entries(replacements)) {
    message = message.split(key).join(val);
  }
  return message;
}

export function getWhatsAppDirectUrl(phoneNumber: string, message: string): string {
  const normalized = normalizePhoneNumber(phoneNumber);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

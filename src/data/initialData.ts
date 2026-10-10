import { Student, AttendanceRecord, NotificationLog, SchoolSettings, LeaveRequest } from '../types/attendance';

export const initialSchoolSettings: SchoolSettings = {
  schoolName: 'Sekolah Menengah Atas',
  schoolNPSN: '-',
  address: 'Alamat Sekolah',
  academicYear: '2026/2027',
  semester: 'Ganjil',
  checkInStart: '06:30',
  checkInStandard: '07:00',
  lateThreshold: '07:15',
  checkOutStart: '14:00',
  autoNotifyWhatsApp: true,
  soundBeepEnabled: true,
  cameraFacingMode: 'environment',
  whatsappTemplates: {
    masukTepatWaktu: `📢 *PRESENSI SISWA - {sekolah}*\n\nYth. Bapak/Ibu *{wali}*,\nKami informasikan bahwa ananda:\n👤 *{nama}* (NISN: {nisn})\n🏫 Kelas: *{kelas}*\n\n✅ Telah hadir di sekolah pada *{jam} WIB*, tanggal *{tanggal}* dengan status *{status}*.\n\nTerima kasih atas kerja samanya dalam mendisiplinkan putra/putri kita.\n\n_Sistem Absensi Otomatis HadirSiswa_`,
    masukTerlambat: `⚠️ *PEMBERITAHUAN KETERLAMBATAN SISWA*\n\nYth. Bapak/Ibu *{wali}*,\nKami informasikan bahwa ananda:\n👤 *{nama}* (NISN: {nisn})\n🏫 Kelas: *{kelas}*\n\n⏱️ Tiba di sekolah pada *{jam} WIB*, tanggal *{tanggal}* (Batas toleransi 07:15 WIB).\nStatus: *{status}*.\n\nMohon perhatian Bapak/Ibu untuk memantau waktu keberangkatan ananda ke sekolah.\n\n_Sistem Absensi Otomatis HadirSiswa_`,
    pulang: `🎒 *PRESENSI PULANG SISWA - {sekolah}*\n\nYth. Bapak/Ibu *{wali}*,\nKami informasikan bahwa ananda:\n👤 *{nama}* (NISN: {nisn})\n🏫 Kelas: *{kelas}*\n\n🚪 Telah melakukan presensi pulang sekolah pada *{jam} WIB*, tanggal *{tanggal}*.\n\nSemoga selamat sampai di rumah. Terima kasih.\n\n_Sistem Absensi Otomatis HadirSiswa_`,
    izin: `📋 *KONFIRMASI PENGAJUAN IZIN/SAKIT*\n\nYth. Bapak/Ibu *{wali}*,\nPengajuan ketidakhadiran ananda *{nama}* ({kelas}) tanggal *{tanggal}* dengan keterangan *{status}* telah kami terima dan tercatat di sistem presensi sekolah.\n\n_Sistem Absensi Otomatis HadirSiswa_`,
  },
};

// No demo accounts - system starts empty and real
export const initialStudents: Student[] = [];

export function getInitialAttendanceRecords(_todayDateStr: string): {
  records: AttendanceRecord[];
  notifications: NotificationLog[];
} {
  return { records: [], notifications: [] };
}

export const initialLeaveRequests: LeaveRequest[] = [];

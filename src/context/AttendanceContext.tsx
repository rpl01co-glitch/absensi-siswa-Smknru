import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Student,
  AttendanceRecord,
  NotificationLog,
  SchoolSettings,
  LeaveRequest,
  AttendanceType,
  AttendanceStatus,
} from '../types/attendance';
import {
  initialSchoolSettings,
  initialStudents,
  getInitialAttendanceRecords,
  initialLeaveRequests,
} from '../data/initialData';
import { formatWhatsAppMessage, getWhatsAppDirectUrl } from '../utils/whatsapp';
import { playSuccessChime, playLateAlertSound, playErrorBuzz } from '../utils/audio';

interface ScanResultData {
  student: Student;
  record: AttendanceRecord;
  notification: NotificationLog;
  isDuplicate?: boolean;
}

interface AttendanceContextType {
  students: Student[];
  records: AttendanceRecord[];
  notifications: NotificationLog[];
  settings: SchoolSettings;
  leaveRequests: LeaveRequest[];
  recentScanResult: ScanResultData | null;
  scanAttendance: (qrData: string, type: AttendanceType) => { success: boolean; message: string; data?: ScanResultData };
  recordManualAttendance: (
    studentId: string,
    status: AttendanceStatus,
    type: AttendanceType,
    note?: string
  ) => { success: boolean; message: string };
  addStudent: (student: Omit<Student, 'id' | 'qrCodeData'>) => void;
  importStudentsBatch: (studentsList: Array<Omit<Student, 'id' | 'qrCodeData'>>) => number;
  updateStudent: (student: Student) => void;
  deleteStudent: (id: string) => void;
  updateSettings: (newSettings: SchoolSettings) => void;
  submitLeaveRequest: (data: Omit<LeaveRequest, 'id' | 'status' | 'submittedAt'>) => void;
  approveLeaveRequest: (id: string) => void;
  clearRecentScanResult: () => void;
  openWhatsAppForNotification: (notifId: string) => void;
  clearAllAttendanceData: () => void;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

// Use clean production keys to remove any previous demo mock data from local storage
const STORAGE_KEYS = {
  STUDENTS: 'hadirsiswa_prod_students_v2',
  RECORDS: 'hadirsiswa_prod_records_v2',
  NOTIFICATIONS: 'hadirsiswa_prod_notifications_v2',
  SETTINGS: 'hadirsiswa_prod_settings_v2',
  LEAVES: 'hadirsiswa_prod_leaves_v2',
};

export const AttendanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Clean out legacy demo storage keys on first load if any exist
  useEffect(() => {
    localStorage.removeItem('hadirsiswa_students_v1');
    localStorage.removeItem('hadirsiswa_records_v1');
    localStorage.removeItem('hadirsiswa_notifications_v1');
    localStorage.removeItem('hadirsiswa_leaves_v1');
  }, []);

  const [settings, setSettings] = useState<SchoolSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialSchoolSettings;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialStudents;
  });

  const [records, setRecords] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    const initial = getInitialAttendanceRecords(todayStr);
    return initial.records;
  });

  const [notifications, setNotifications] = useState<NotificationLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    const initial = getInitialAttendanceRecords(todayStr);
    return initial.notifications;
  });

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LEAVES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialLeaveRequests;
  });

  const [recentScanResult, setRecentScanResult] = useState<ScanResultData | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(leaveRequests));
  }, [leaveRequests]);

  // Scan attendance logic
  const scanAttendance = (
    qrPayload: string,
    type: AttendanceType
  ): { success: boolean; message: string; data?: ScanResultData } => {
    const trimmed = qrPayload.trim();
    if (!trimmed) {
      if (settings.soundBeepEnabled) playErrorBuzz();
      return { success: false, message: 'QR Code kosong atau tidak terbaca.' };
    }

    if (students.length === 0) {
      if (settings.soundBeepEnabled) playErrorBuzz();
      return {
        success: false,
        message: 'Belum ada data siswa terdaftar di sistem. Daftarkan siswa terlebih dahulu di menu "Data Siswa & Kartu".',
      };
    }

    // Match student by QR code payload or NISN or ID
    const student = students.find(
      (s) =>
        s.qrCodeData === trimmed ||
        s.nisn === trimmed ||
        s.id === trimmed ||
        trimmed.includes(s.nisn) ||
        trimmed.includes(s.id)
    );

    if (!student) {
      if (settings.soundBeepEnabled) playErrorBuzz();
      return { success: false, message: `Siswa dengan kode/NISN "${trimmed}" tidak ditemukan dalam sistem.` };
    }

    if (student.status !== 'aktif') {
      if (settings.soundBeepEnabled) playErrorBuzz();
      return { success: false, message: `Status siswa ${student.name} tidak aktif.` };
    }

    const now = new Date();
    const currentDateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0]; // HH:mm:ss
    const timeShort = timeStr.slice(0, 5); // HH:mm

    // Check duplicate scan for today and type
    const existing = records.find(
      (r) => r.studentId === student.id && r.date === currentDateStr && r.type === type
    );

    if (existing) {
      if (settings.soundBeepEnabled) playErrorBuzz();
      return {
        success: false,
        message: `${student.name} sudah melakukan presensi ${type === 'masuk' ? 'masuk' : 'pulang'} hari ini pada pukul ${existing.timeStr} WIB.`,
      };
    }

    // Determine status: tepat_waktu or terlambat
    let status: AttendanceStatus = 'tepat_waktu';
    if (type === 'masuk') {
      if (timeShort > settings.lateThreshold) {
        status = 'terlambat';
      }
    }

    // Play sound chime
    if (settings.soundBeepEnabled) {
      if (status === 'terlambat') {
        playLateAlertSound();
      } else {
        playSuccessChime();
      }
    }

    // Template message
    const templateToUse =
      type === 'pulang'
        ? settings.whatsappTemplates.pulang
        : status === 'terlambat'
        ? settings.whatsappTemplates.masukTerlambat
        : settings.whatsappTemplates.masukTepatWaktu;

    const formattedMessage = formatWhatsAppMessage(
      templateToUse,
      student,
      { type, status, timeStr, date: currentDateStr },
      settings
    );

    const recordId = `rec-${Date.now()}`;
    const notifId = `notif-${Date.now()}`;

    const newRecord: AttendanceRecord = {
      id: recordId,
      studentId: student.id,
      studentName: student.name,
      studentNisn: student.nisn,
      class: student.class,
      timestamp: now.toISOString(),
      date: currentDateStr,
      timeStr,
      type,
      status,
      method: 'qr_scan',
      parentNotified: settings.autoNotifyWhatsApp,
      notifiedAt: now.toISOString(),
      notificationChannel: 'whatsapp',
      whatsappMessageSent: formattedMessage,
    };

    const newNotification: NotificationLog = {
      id: notifId,
      attendanceId: recordId,
      studentId: student.id,
      studentName: student.name,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      message: formattedMessage,
      timestamp: now.toISOString(),
      timeStr,
      status: 'terkirim',
      channel: 'whatsapp',
      type,
    };

    setRecords((prev) => [newRecord, ...prev]);
    if (settings.autoNotifyWhatsApp) {
      setNotifications((prev) => [newNotification, ...prev]);
    }

    const resultData: ScanResultData = {
      student,
      record: newRecord,
      notification: newNotification,
    };

    setRecentScanResult(resultData);

    return {
      success: true,
      message: `Presensi ${type === 'masuk' ? 'masuk' : 'pulang'} berhasil tercatat untuk ${student.name}.`,
      data: resultData,
    };
  };

  const recordManualAttendance = (
    studentId: string,
    status: AttendanceStatus,
    type: AttendanceType,
    note?: string
  ): { success: boolean; message: string } => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return { success: false, message: 'Siswa tidak ditemukan.' };

    const now = new Date();
    const currentDateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    const recordId = `rec-${Date.now()}`;
    const notifId = `notif-${Date.now()}`;

    const templateToUse =
      status === 'izin' || status === 'sakit'
        ? settings.whatsappTemplates.izin
        : status === 'terlambat'
        ? settings.whatsappTemplates.masukTerlambat
        : type === 'pulang'
        ? settings.whatsappTemplates.pulang
        : settings.whatsappTemplates.masukTepatWaktu;

    const formattedMessage = formatWhatsAppMessage(
      templateToUse,
      student,
      { type, status, timeStr, date: currentDateStr },
      settings
    );

    const newRecord: AttendanceRecord = {
      id: recordId,
      studentId: student.id,
      studentName: student.name,
      studentNisn: student.nisn,
      class: student.class,
      timestamp: now.toISOString(),
      date: currentDateStr,
      timeStr,
      type,
      status,
      method: 'manual',
      note,
      parentNotified: settings.autoNotifyWhatsApp,
      notifiedAt: now.toISOString(),
      notificationChannel: 'whatsapp',
      whatsappMessageSent: formattedMessage,
    };

    const newNotification: NotificationLog = {
      id: notifId,
      attendanceId: recordId,
      studentId: student.id,
      studentName: student.name,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      message: formattedMessage,
      timestamp: now.toISOString(),
      timeStr,
      status: 'terkirim',
      channel: 'whatsapp',
      type: status === 'izin' || status === 'sakit' ? 'izin' : type,
    };

    setRecords((prev) => [newRecord, ...prev]);
    if (settings.autoNotifyWhatsApp) {
      setNotifications((prev) => [newNotification, ...prev]);
    }

    if (settings.soundBeepEnabled) {
      playSuccessChime();
    }

    return {
      success: true,
      message: `Presensi manual ${student.name} (${status.toUpperCase()}) berhasil disimpan.`,
    };
  };

  const addStudent = (studentData: Omit<Student, 'id' | 'qrCodeData'>) => {
    const newId = `stu-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newStudent: Student = {
      ...studentData,
      id: newId,
      qrCodeData: `HS:${studentData.nisn}:${newId}`,
    };
    setStudents((prev) => [newStudent, ...prev]);
  };

  const importStudentsBatch = (studentsList: Array<Omit<Student, 'id' | 'qrCodeData'>>): number => {
    const existingNisns = new Set(students.map((s) => s.nisn));
    const newStudents: Student[] = [];

    studentsList.forEach((item, idx) => {
      if (!item.nisn || existingNisns.has(item.nisn)) return;
      const newId = `stu-${Date.now()}-${idx}`;
      newStudents.push({
        ...item,
        id: newId,
        qrCodeData: `HS:${item.nisn}:${newId}`,
      });
      existingNisns.add(item.nisn);
    });

    if (newStudents.length > 0) {
      setStudents((prev) => [...newStudents, ...prev]);
    }

    return newStudents.length;
  };

  const updateStudent = (updatedStudent: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)));
  };

  const deleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSettings = (newSettings: SchoolSettings) => {
    setSettings(newSettings);
  };

  const submitLeaveRequest = (data: Omit<LeaveRequest, 'id' | 'status' | 'submittedAt'>) => {
    const newLeave: LeaveRequest = {
      ...data,
      id: `leave-${Date.now()}`,
      status: 'menunggu',
      submittedAt: new Date().toISOString(),
    };
    setLeaveRequests((prev) => [newLeave, ...prev]);
  };

  const approveLeaveRequest = (id: string) => {
    setLeaveRequests((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: 'disetujui' } : l))
    );
    const leave = leaveRequests.find((l) => l.id === id);
    if (leave) {
      recordManualAttendance(
        leave.studentId,
        leave.type === 'sakit' ? 'sakit' : 'izin',
        'masuk',
        leave.reason
      );
    }
  };

  const clearRecentScanResult = () => {
    setRecentScanResult(null);
  };

  const openWhatsAppForNotification = (notifId: string) => {
    const notif = notifications.find((n) => n.id === notifId);
    if (!notif) return;
    const url = getWhatsAppDirectUrl(notif.parentPhone, notif.message);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const clearAllAttendanceData = () => {
    setRecords([]);
    setNotifications([]);
    setLeaveRequests([]);
    setRecentScanResult(null);
    localStorage.removeItem(STORAGE_KEYS.RECORDS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.LEAVES);
  };

  return (
    <AttendanceContext.Provider
      value={{
        students,
        records,
        notifications,
        settings,
        leaveRequests,
        recentScanResult,
        scanAttendance,
        recordManualAttendance,
        addStudent,
        importStudentsBatch,
        updateStudent,
        deleteStudent,
        updateSettings,
        submitLeaveRequest,
        approveLeaveRequest,
        clearRecentScanResult,
        openWhatsAppForNotification,
        clearAllAttendanceData,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within an AttendanceProvider');
  }
  return context;
};

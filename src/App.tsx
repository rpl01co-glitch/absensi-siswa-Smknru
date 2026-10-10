/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AttendanceProvider, useAttendance } from './context/AttendanceContext';
import { Navbar, ActiveTab } from './components/Navbar';
import { ScannerView } from './components/Scanner/ScannerView';
import { AttendanceDashboard } from './components/Dashboard/AttendanceDashboard';
import { StudentList } from './components/Students/StudentList';
import { NotificationCenter } from './components/Notifications/NotificationCenter';
import { ParentPortalView } from './components/ParentPortal/ParentPortalView';
import { SettingsModal } from './components/Settings/SettingsModal';

function MainApp() {
  const { settings, notifications, scanAttendance } = useAttendance();
  const [activeTab, setActiveTab] = useState<ActiveTab>('scanner');
  const [isKioskMode, setIsKioskMode] = useState<boolean>(false);

  const handleScanStudentDirectly = (qrPayload: string) => {
    setActiveTab('scanner');
    scanAttendance(qrPayload, 'masuk');
  };

  if (isKioskMode) {
    return (
      <ScannerView
        isKioskMode={true}
        onExitKiosk={() => setIsKioskMode(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadNotifsCount={notifications.length}
        onOpenKiosk={() => setIsKioskMode(true)}
        schoolName={settings.schoolName}
      />

      {/* Main Content Viewport */}
      <main className="flex-1">
        {activeTab === 'scanner' && (
          <ScannerView onNavigateToStudents={() => setActiveTab('students')} />
        )}
        {activeTab === 'dashboard' && <AttendanceDashboard />}
        {activeTab === 'students' && (
          <StudentList onScanStudentDirectly={handleScanStudentDirectly} />
        )}
        {activeTab === 'notifications' && <NotificationCenter />}
        {activeTab === 'parent-portal' && <ParentPortalView />}
        {activeTab === 'settings' && <SettingsModal />}
      </main>

      {/* Clean Human Footer (No telemetry slop) */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">{settings.schoolName}</span>
            <span aria-hidden="true">·</span>
            <span>Sistem Presensi Siswa QR & Notifikasi Otomatis Orang Tua</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>NPSN: {settings.schoolNPSN}</span>
            <span aria-hidden="true">·</span>
            <span>Tahun Ajaran {settings.academicYear}</span>
            <span aria-hidden="true">·</span>
            <span>HadirSiswa v1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AttendanceProvider>
      <MainApp />
    </AttendanceProvider>
  );
}

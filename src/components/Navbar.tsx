import React from 'react';
import { QrCode, Bell, Shield, School, Maximize2 } from 'lucide-react';

export type ActiveTab = 'scanner' | 'dashboard' | 'students' | 'notifications' | 'parent-portal' | 'settings';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  unreadNotifsCount: number;
  onOpenKiosk: () => void;
  schoolName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  unreadNotifsCount,
  onOpenKiosk,
  schoolName,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.03)] no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand title wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
              HadirSiswa
            </span>
            <div className="text-[11px] text-slate-600 font-medium tracking-tight truncate max-w-[160px] sm:max-w-xs">
              {schoolName}
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Single-line controls) */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2 text-sm font-medium">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'scanner'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Pemindai QR</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <School className="w-4 h-4" />
            <span>Dashboard & Rekap</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'students'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Daftar Siswa & Kartu</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 relative ${
              activeTab === 'notifications'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifikasi Ortu</span>
            {unreadNotifsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('parent-portal')}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'parent-portal'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Portal Orang Tua</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setActiveTab('settings')}
            className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
              activeTab === 'settings'
                ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Pengaturan Presensi & Template Notifikasi"
          >
            <span className="hidden sm:inline">Pengaturan</span>
            <span className="sm:hidden">⚙️</span>
          </button>

          <button
            onClick={onOpenKiosk}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-sm"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Mode Kiosk Gerbang</span>
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-slate-100 gap-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('scanner')}
          className={`px-3 py-1 text-xs rounded font-medium whitespace-nowrap ${
            activeTab === 'scanner' ? 'bg-indigo-600 text-white' : 'text-slate-600'
          }`}
        >
          Pemindai QR
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3 py-1 text-xs rounded font-medium whitespace-nowrap ${
            activeTab === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-600'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`px-3 py-1 text-xs rounded font-medium whitespace-nowrap ${
            activeTab === 'students' ? 'bg-indigo-600 text-white' : 'text-slate-600'
          }`}
        >
          Siswa & Kartu
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-3 py-1 text-xs rounded font-medium whitespace-nowrap ${
            activeTab === 'notifications' ? 'bg-indigo-600 text-white' : 'text-slate-600'
          }`}
        >
          Notifikasi Ortu
        </button>
        <button
          onClick={() => setActiveTab('parent-portal')}
          className={`px-3 py-1 text-xs rounded font-medium whitespace-nowrap ${
            activeTab === 'parent-portal' ? 'bg-indigo-600 text-white' : 'text-slate-600'
          }`}
        >
          Portal Ortu
        </button>
      </div>
    </header>
  );
};

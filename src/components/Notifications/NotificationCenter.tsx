import React, { useState } from 'react';
import {
  Bell,
  Send,
  ExternalLink,
  Search,
  MessageSquare,
  CheckCheck,
  Smartphone,
  PhoneCall,
  Sparkles,
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { NotificationLog } from '../../types/attendance';
import { getWhatsAppDirectUrl } from '../../utils/whatsapp';

export const NotificationCenter: React.FC = () => {
  const { notifications, students, settings } = useAttendance();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotif, setSelectedNotif] = useState<NotificationLog | null>(
    notifications[0] || null
  );

  const filteredNotifs = notifications.filter(
    (n) =>
      n.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.parentPhone.includes(searchQuery)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Pusat Notifikasi Real-time</span>
            <span aria-hidden="true">·</span>
            <span>WhatsApp Gateway Gateway Sekolah</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Log Notifikasi Orang Tua
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-semibold text-emerald-800">
            Gateway Notifikasi Otomatis Aktif ({notifications.length} Pesan Terkirim)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 items-start">
        {/* Left Column: Notification Feed List (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari siswa, nama wali, atau nomor WhatsApp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-[640px] overflow-y-auto shadow-2xs">
            {filteredNotifs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-300" />
                <p className="font-semibold text-slate-600">Belum ada riwayat notifikasi</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                  Pesan WhatsApp ke nomor orang tua akan otomatis tercatat dan dapat dipratinjau di sini setiap kali siswa melakukan presensi QR.
                </p>
              </div>
            ) : (
              filteredNotifs.map((notif) => {
                const isSelected = selectedNotif?.id === notif.id;
                return (
                  <div
                    key={notif.id}
                    onClick={() => setSelectedNotif(notif)}
                    className={`p-3.5 cursor-pointer transition-colors text-xs flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-50/70 border-l-2 border-indigo-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                        WA
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 leading-tight">
                          {notif.studentName}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          Wali: {notif.parentName} ·{' '}
                          <span className="font-mono tabular-nums">{notif.parentPhone}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-1">
                          {notif.message}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono tabular-nums text-[11px] text-slate-500">
                        {notif.timeStr}
                      </div>
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-1">
                        <CheckCheck className="w-3 h-3 text-emerald-600" />
                        Terkirim
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: WhatsApp Interactive Preview Simulator (5 Cols) */}
        <div className="lg:col-span-5 sticky top-24">
          <div className="bg-slate-900 rounded-2xl p-4 shadow-xl text-white border border-slate-800">
            {/* Phone Top Header Mockup */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold tracking-tight">
                  Simulasi Tampilan WhatsApp Wali Murid
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Live Preview</span>
            </div>

            {selectedNotif ? (
              <div className="mt-4">
                {/* Simulated WhatsApp Contact Top Bar */}
                <div className="bg-slate-800/90 rounded-t-xl px-3.5 py-2.5 flex items-center justify-between border-b border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                      HS
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white leading-tight">
                        {settings.schoolName}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-medium">
                        Akun Resmi Presensi Sekolah
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    <PhoneCall className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Simulated WhatsApp Chat Background */}
                <div className="bg-[#0b141a] p-4 rounded-b-xl min-h-[280px] flex flex-col justify-end space-y-3">
                  {/* Date badge */}
                  <div className="text-center">
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
                      HARI INI
                    </span>
                  </div>

                  {/* Outgoing Message Bubble */}
                  <div className="max-w-[90%] self-end bg-[#005c4b] text-white p-3 rounded-2xl rounded-tr-xs shadow-md text-xs leading-relaxed">
                    <div className="whitespace-pre-line text-[11px]">
                      {selectedNotif.message}
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-1.5 text-[9px] text-slate-300">
                      <span className="font-mono tabular-nums">{selectedNotif.timeStr}</span>
                      <CheckCheck className="w-3 h-3 text-[#53bdeb]" />
                    </div>
                  </div>
                </div>

                {/* Action Buttons Below Phone */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-2">
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Penerima: {selectedNotif.parentName}</span>
                    <span className="font-mono tabular-nums text-emerald-400 font-semibold">
                      {selectedNotif.parentPhone}
                    </span>
                  </div>

                  <a
                    href={getWhatsAppDirectUrl(selectedNotif.parentPhone, selectedNotif.message)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Buka Chat di WhatsApp Web / App</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </a>

                  <p className="text-[10px] text-slate-500 text-center leading-normal">
                    Mengklik tombol ini akan membuka aplikasi WhatsApp dengan nomor dan pesan di atas secara instan.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                <Smartphone className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="font-medium text-slate-400">Belum ada notifikasi yang dipilih</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Pratinjau tampilan pesan WhatsApp yang terkirim ke wali murid akan tampil di sini.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Settings, Save, RotateCcw, Volume2, Bell, Clock, Building } from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { SchoolSettings } from '../../types/attendance';

export const SettingsModal: React.FC = () => {
  const { settings, updateSettings, clearAllAttendanceData } = useAttendance();

  const [formData, setFormData] = useState<SchoolSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Konfigurasi Sistem</span>
            <span aria-hidden="true">·</span>
            <span>Jadwal & Gateway Notifikasi</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Pengaturan Presensi & Sekolah
          </h1>
        </div>

        {saveSuccess && (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg animate-fade-in">
            ✓ Pengaturan berhasil disimpan
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6 text-xs">
        {/* School Profile Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            <Building className="w-4 h-4 text-indigo-600" />
            <span>Identitas Sekolah</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Nama Satuan Pendidikan</label>
              <input
                type="text"
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">NPSN</label>
              <input
                type="text"
                value={formData.schoolNPSN}
                onChange={(e) => setFormData({ ...formData, schoolNPSN: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Tahun Ajaran</label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Alamat Sekolah</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>

        {/* Schedule & Tolerance Rules */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Waktu Operasional & Ambang Batas Terlambat</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Jam Masuk Standar (WIB)
              </label>
              <input
                type="time"
                value={formData.checkInStandard}
                onChange={(e) => setFormData({ ...formData, checkInStandard: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Waktu mulai masuk kelas</span>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Batas Toleransi Terlambat (WIB)
              </label>
              <input
                type="time"
                value={formData.lateThreshold}
                onChange={(e) => setFormData({ ...formData, lateThreshold: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-amber-700"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Lewat jam ini ditandai Terlambat
              </span>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Jam Mulai Pulang (WIB)
              </label>
              <input
                type="time"
                value={formData.checkOutStart}
                onChange={(e) => setFormData({ ...formData, checkOutStart: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Siswa boleh scan pulang</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.soundBeepEnabled}
                onChange={(e) => setFormData({ ...formData, soundBeepEnabled: e.target.checked })}
                className="rounded text-indigo-600 w-4 h-4"
              />
              <Volume2 className="w-4 h-4 text-slate-600" />
              <span className="font-medium text-slate-700">
                Aktifkan Suara Beep / Chime saat Scan Berhasil
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoNotifyWhatsApp}
                onChange={(e) =>
                  setFormData({ ...formData, autoNotifyWhatsApp: e.target.checked })
                }
                className="rounded text-indigo-600 w-4 h-4"
              />
              <Bell className="w-4 h-4 text-slate-600" />
              <span className="font-medium text-slate-700">
                Kirim Notifikasi Real-Time Otomatis ke WhatsApp Orang Tua
              </span>
            </label>
          </div>
        </div>

        {/* WhatsApp Notification Templates */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            <Bell className="w-4 h-4 text-indigo-600" />
            <span>Format Template Pesan WhatsApp Orang Tua</span>
          </div>

          <p className="text-slate-500 text-[11px]">
            Variabel otomatis yang tersedia: <code className="bg-slate-100 px-1 py-0.5 rounded">{`{nama}`}</code>,{' '}
            <code className="bg-slate-100 px-1 py-0.5 rounded">{`{nisn}`}</code>,{' '}
            <code className="bg-slate-100 px-1 py-0.5 rounded">{`{kelas}`}</code>,{' '}
            <code className="bg-slate-100 px-1 py-0.5 rounded">{`{wali}`}</code>,{' '}
            <code className="bg-slate-100 px-1 py-0.5 rounded">{`{jam}`}</code>,{' '}
            <code className="bg-slate-100 px-1 py-0.5 rounded">{`{tanggal}`}</code>,{' '}
            <code className="bg-slate-100 px-1 py-0.5 rounded">{`{status}`}</code>,{' '}
            <code className="bg-slate-100 px-1 py-0.5 rounded">{`{sekolah}`}</code>.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Template: Hadir Tepat Waktu
              </label>
              <textarea
                rows={4}
                value={formData.whatsappTemplates.masukTepatWaktu}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    whatsappTemplates: {
                      ...formData.whatsappTemplates,
                      masukTepatWaktu: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Template: Hadir Terlambat
              </label>
              <textarea
                rows={4}
                value={formData.whatsappTemplates.masukTerlambat}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    whatsappTemplates: {
                      ...formData.whatsappTemplates,
                      masukTerlambat: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Template: Presensi Pulang
              </label>
              <textarea
                rows={4}
                value={formData.whatsappTemplates.pulang}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    whatsappTemplates: {
                      ...formData.whatsappTemplates,
                      pulang: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-[11px]"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => {
              if (confirm('Hapus seluruh riwayat presensi dan log notifikasi yang telah tercatat? Data siswa tetap tersimpan.')) {
                clearAllAttendanceData();
                alert('Riwayat presensi berhasil dikosongkan.');
              }
            }}
            className="px-3.5 py-2 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Kosongkan Riwayat Presensi</span>
          </button>

          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-2 shadow-sm transition-colors text-xs"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan Pengaturan</span>
          </button>
        </div>
      </form>
    </div>
  );
};

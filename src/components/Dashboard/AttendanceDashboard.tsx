import React, { useState } from 'react';
import {
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  Search,
  PlusCircle,
  Send,
  FileSpreadsheet,
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { AttendanceStatus, AttendanceType } from '../../types/attendance';

export const AttendanceDashboard: React.FC = () => {
  const { students, records, notifications, recordManualAttendance, settings } = useAttendance();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Manual entry modal state
  const [manualStudentId, setManualStudentId] = useState('');
  const [manualStatus, setManualStatus] = useState<AttendanceStatus>('tepat_waktu');
  const [manualType, setManualType] = useState<AttendanceType>('masuk');
  const [manualNote, setManualNote] = useState('');
  const [manualFeedback, setManualFeedback] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = records.filter((r) => r.date === todayStr);

  // Statistics calculation
  const totalStudents = students.length;
  const presentCount = new Set(
    todayRecords.filter((r) => r.status === 'tepat_waktu' || r.status === 'terlambat').map((r) => r.studentId)
  ).size;
  const onTimeCount = todayRecords.filter((r) => r.status === 'tepat_waktu').length;
  const lateCount = todayRecords.filter((r) => r.status === 'terlambat').length;
  const permittedCount = todayRecords.filter((r) => r.status === 'izin' || r.status === 'sakit').length;
  const absentCount = Math.max(0, totalStudents - presentCount - permittedCount);
  const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
  const todayNotifsCount = notifications.filter((n) => n.timestamp.startsWith(todayStr)).length;

  // Filtered attendance records
  const filteredRecords = todayRecords.filter((rec) => {
    const matchesSearch =
      rec.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.studentNisn.includes(searchQuery) ||
      rec.class.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === 'all' || rec.class === selectedClass;
    const matchesStatus = selectedStatus === 'all' || rec.status === selectedStatus;
    return matchesSearch && matchesClass && matchesStatus;
  });

  // Extract unique classes
  const classes = Array.from(new Set(students.map((s) => s.class))).sort();

  // Handle Export CSV
  const handleExportCsv = () => {
    const headers = [
      'No',
      'NISN',
      'Nama Siswa',
      'Kelas',
      'Tanggal',
      'Waktu Presensi',
      'Tipe',
      'Status',
      'Metode',
      'Notifikasi WA Ortu',
    ];

    const rows = filteredRecords.map((r, i) => [
      i + 1,
      r.studentNisn,
      `"${r.studentName}"`,
      `"${r.class}"`,
      r.date,
      r.timeStr,
      r.type === 'masuk' ? 'Masuk' : 'Pulang',
      r.status,
      r.method,
      r.parentNotified ? 'Terkirim' : 'Belum',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_absensi_${settings.schoolName.replace(/\s+/g, '_')}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStudentId) {
      setManualFeedback('Pilih siswa terlebih dahulu.');
      return;
    }

    const res = recordManualAttendance(manualStudentId, manualStatus, manualType, manualNote);
    if (res.success) {
      setIsManualModalOpen(false);
      setManualStudentId('');
      setManualNote('');
      setManualFeedback(null);
    } else {
      setManualFeedback(res.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Rekapitulasi Presensi</span>
            <span aria-hidden="true">·</span>
            <span>{settings.schoolName}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{todayStr}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Dashboard & Rekapitulasi Presensi
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />
            <span>Catat Izin / Presensi Manual</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Statistic Grid (Tabular Numerals, Clean Surface) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 my-6">
        {/* Total Siswa */}
        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Siswa</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            {totalStudents}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
            {classes.length} Rombel Kelas Terdaftar
          </div>
        </div>

        {/* Hadir Hari Ini */}
        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Tingkat Hadir</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 mt-2">
            {attendanceRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span className="font-mono tabular-nums">{presentCount}</span> dari {totalStudents} Siswa
          </div>
        </div>

        {/* Hadir Tepat Waktu */}
        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Tepat Waktu</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-indigo-600 mt-2">
            {onTimeCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">&lt; {settings.lateThreshold} WIB</div>
        </div>

        {/* Terlambat */}
        <div className="p-4 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Terlambat</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 mt-2">
            {lateCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">&gt; {settings.lateThreshold} WIB</div>
        </div>

        {/* Notifikasi WhatsApp Ortu */}
        <div className="col-span-2 md:col-span-1 p-4 bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>WA Terkirim</span>
            <Send className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 mt-2">
            {todayNotifsCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">100% Real-time ke Wali</div>
        </div>
      </div>

      {/* Class Level Attendance Overview Bar */}
      {classes.length > 0 && (
        <div className="p-4 bg-white rounded-xl border border-slate-200 mb-6">
          <h3 className="text-xs font-bold text-slate-900 mb-3">
            Persentase Kehadiran per Kelas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {classes.map((cls) => {
              const classStudents = students.filter((s) => s.class === cls);
              const classPresent = classStudents.filter((s) =>
                todayRecords.some(
                  (r) =>
                    r.studentId === s.id &&
                    (r.status === 'tepat_waktu' || r.status === 'terlambat')
                )
              ).length;
              const percentage =
                classStudents.length > 0
                  ? Math.round((classPresent / classStudents.length) * 100)
                  : 0;

              return (
                <div key={cls} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{cls}</span>
                    <span className="font-mono tabular-nums text-slate-600">
                      {classPresent}/{classStudents.length} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter and Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        {/* Table Filters */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, NISN, atau kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {/* Filter Kelas */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
            >
              <option value="all">Semua Kelas</option>
              {classes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Filter Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
            >
              <option value="all">Semua Status</option>
              <option value="tepat_waktu">Tepat Waktu</option>
              <option value="terlambat">Terlambat</option>
              <option value="izin">Izin</option>
              <option value="sakit">Sakit</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Siswa</th>
                <th className="py-3 px-4">NISN</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Waktu Presensi</th>
                <th className="py-3 px-4">Tipe</th>
                <th className="py-3 px-4">Status Kehadiran</th>
                <th className="py-3 px-4 text-right">Notifikasi Ortu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Tidak ada catatan presensi yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {record.studentName}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                      {record.studentNisn}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {record.class}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-800">
                      {record.timeStr} WIB
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-700">
                      Presensi {record.type}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block font-semibold px-2 py-0.5 rounded text-[11px] ${
                          record.status === 'tepat_waktu'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : record.status === 'terlambat'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : record.status === 'sakit'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-purple-50 text-purple-800 border border-purple-200'
                        }`}
                      >
                        {record.status === 'tepat_waktu'
                          ? 'Tepat Waktu'
                          : record.status === 'terlambat'
                          ? 'Terlambat'
                          : record.status === 'sakit'
                          ? 'Sakit'
                          : 'Izin'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Terkirim ke WA
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Attendance Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Catat Presensi Manual / Surat Izin
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Gunakan jika siswa lupa membawa kartu QR atau berhalangan hadir karena izin/sakit.
            </p>

            {manualFeedback && (
              <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs">
                {manualFeedback}
              </div>
            )}

            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Pilih Siswa</label>
                <select
                  value={manualStudentId}
                  onChange={(e) => setManualStudentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  required
                >
                  <option value="">-- Pilih Siswa --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.class}) - NISN: {s.nisn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Status Kehadiran</label>
                  <select
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value as AttendanceStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="tepat_waktu">Tepat Waktu</option>
                    <option value="terlambat">Terlambat</option>
                    <option value="izin">Izin</option>
                    <option value="sakit">Sakit</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Tipe Sesi</label>
                  <select
                    value={manualType}
                    onChange={(e) => setManualType(e.target.value as AttendanceType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="masuk">Masuk Sekolah</option>
                    <option value="pulang">Pulang Sekolah</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Catatan / Keterangan (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Misal: Surat dokter terlampir, lupa bawa kartu..."
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  Simpan & Kirim Notif
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

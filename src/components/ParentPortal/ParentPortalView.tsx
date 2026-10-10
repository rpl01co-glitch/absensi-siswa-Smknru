import React, { useState } from 'react';
import {
  Shield,
  Clock,
  CheckCircle,
  FileText,
  Send,
  Check,
  Search,
  User,
  AlertCircle,
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { Student } from '../../types/attendance';

export const ParentPortalView: React.FC = () => {
  const { students, records, submitLeaveRequest, settings } = useAttendance();

  const [searchNisn, setSearchNisn] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'status' | 'leave'>('status');

  // Leave form states
  const [leaveType, setLeaveType] = useState<'izin' | 'sakit'>('izin');
  const [leaveDateStart, setLeaveDateStart] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [leaveDateEnd, setLeaveDateEnd] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveSuccessMsg, setLeaveSuccessMsg] = useState(false);

  // Find student by selected ID or by NISN search
  const selectedStudent: Student | undefined =
    students.find((s) => s.id === selectedStudentId) ||
    students.find(
      (s) => s.nisn === searchNisn.trim() || s.name.toLowerCase().includes(searchNisn.trim().toLowerCase())
    );

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = selectedStudent
    ? records.find((r) => r.studentId === selectedStudent.id && r.date === todayStr && r.type === 'masuk')
    : undefined;
  const todayCheckoutRecord = selectedStudent
    ? records.find((r) => r.studentId === selectedStudent.id && r.date === todayStr && r.type === 'pulang')
    : undefined;

  const studentRecords = selectedStudent
    ? records.filter((r) => r.studentId === selectedStudent.id)
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = students.find(
      (s) => s.nisn === searchNisn.trim() || s.name.toLowerCase().includes(searchNisn.trim().toLowerCase())
    );
    if (found) {
      setSelectedStudentId(found.id);
    }
  };

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !leaveReason) return;

    submitLeaveRequest({
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      class: selectedStudent.class,
      dateStart: leaveDateStart,
      dateEnd: leaveDateEnd,
      type: leaveType,
      reason: leaveReason,
      parentName: selectedStudent.parentName || 'Orang Tua',
      parentPhone: selectedStudent.parentPhone || '',
      attachmentName: leaveType === 'sakit' ? 'surat_keterangan_dokter.pdf' : undefined,
    });

    setLeaveSuccessMsg(true);
    setLeaveReason('');
    setTimeout(() => {
      setLeaveSuccessMsg(false);
      setActiveTab('status');
    }, 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Portal Wali Murid</span>
            <span aria-hidden="true">·</span>
            <span>Pemantauan Kehadiran Siswa</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Portal Orang Tua Siswa
          </h1>
        </div>

        {/* Search / Lookup Child by NISN */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Masukkan NISN Siswa..."
              value={searchNisn}
              onChange={(e) => setSearchNisn(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shrink-0"
          >
            Cari
          </button>
        </form>
      </div>

      {/* When no student found / empty database */}
      {!selectedStudent ? (
        <div className="my-12 p-8 bg-white rounded-2xl border border-slate-200 text-center max-w-md mx-auto shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <User className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900">Cari Data Siswa</h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            {students.length === 0
              ? 'Belum ada data siswa terdaftar di sistem sekolah. Daftarkan siswa terlebih dahulu di menu "Data Siswa & Kartu".'
              : 'Ketik Nomor Induk Siswa Nasional (NISN) putra/putri Anda pada kolom pencarian di atas untuk memantau status presensi.'}
          </p>

          {students.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <label className="block text-[11px] font-medium text-slate-500 mb-1.5">
                Atau pilih dari daftar siswa terdaftar:
              </label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
              >
                <option value="">-- Pilih Siswa --</option>
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.class}) - NISN: {st.nisn}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Child Profile Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-slate-800 border-2 border-indigo-400 shadow-sm flex items-center justify-center font-bold text-xl text-white shrink-0 overflow-hidden">
                {selectedStudent.avatarUrl ? (
                  <img
                    src={selectedStudent.avatarUrl}
                    alt={selectedStudent.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span>{selectedStudent.name.charAt(0)}</span>
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white leading-tight">
                  {selectedStudent.name}
                </h2>
                <div className="flex items-center gap-2 text-xs text-indigo-200 mt-1">
                  <span>Kelas {selectedStudent.class}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">NISN: {selectedStudent.nisn}</span>
                </div>
                <div className="text-xs text-indigo-300 mt-0.5">
                  Wali Murid:{' '}
                  <span className="text-white font-medium">
                    {selectedStudent.parentName || 'Orang Tua / Wali'}
                  </span>
                </div>
              </div>
            </div>

            {/* Segmented Tab: Kehadiran Hari Ini vs Ajukan Izin */}
            <div className="flex items-center gap-1.5 p-1 bg-white/10 backdrop-blur-xs rounded-xl self-stretch md:self-auto justify-center">
              <button
                onClick={() => setActiveTab('status')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'status'
                    ? 'bg-white text-indigo-950 shadow-sm'
                    : 'text-indigo-200 hover:text-white'
                }`}
              >
                Status Presensi Hari Ini
              </button>
              <button
                onClick={() => setActiveTab('leave')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'leave'
                    ? 'bg-white text-indigo-950 shadow-sm'
                    : 'text-indigo-200 hover:text-white'
                }`}
              >
                Kirim Surat Izin / Sakit
              </button>
            </div>
          </div>

          {activeTab === 'status' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Today's Arrival Status (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                    Presensi Gerbang Hari Ini ({todayStr})
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Presensi Masuk Card */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Presensi Masuk</span>
                        <Clock className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                          {todayRecord ? todayRecord.timeStr : '--:--:--'}
                        </span>
                        <span className="text-xs text-slate-500">WIB</span>
                      </div>
                      <div className="mt-2">
                        {todayRecord ? (
                          <span
                            className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${
                              todayRecord.status === 'tepat_waktu'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {todayRecord.status === 'tepat_waktu'
                              ? '✓ Hadir Tepat Waktu'
                              : '⚠️ Terlambat Masuk'}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">
                            Belum melakukan presensi masuk
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Presensi Pulang Card */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Presensi Pulang</span>
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                          {todayCheckoutRecord ? todayCheckoutRecord.timeStr : '--:--:--'}
                        </span>
                        <span className="text-xs text-slate-500">WIB</span>
                      </div>
                      <div className="mt-2">
                        {todayCheckoutRecord ? (
                          <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            ✓ Sudah Pulang Sekolah
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">
                            Jadwal pulang {settings.checkOutStart} WIB
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Real-time WhatsApp Notification Confirmation for Parent */}
                  {selectedStudent.parentPhone && (
                    <div className="mt-4 p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        WA
                      </div>
                      <div>
                        <div className="font-semibold text-emerald-950">
                          Notifikasi Terhubung ke Nomor WhatsApp Anda
                        </div>
                        <div className="text-slate-600 mt-0.5 text-[11px] leading-relaxed">
                          Sistem HadirSiswa secara otomatis mengirimkan pesan konfirmasi presensi ananda ke nomor{' '}
                          <span className="font-mono tabular-nums font-semibold text-emerald-900">
                            {selectedStudent.parentPhone}
                          </span>
                          .
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* History Timeline */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                    Riwayat Kehadiran Terakhir
                  </h3>

                  <div className="divide-y divide-slate-100">
                    {studentRecords.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        Belum ada riwayat kehadiran tercatat untuk ananda.
                      </div>
                    ) : (
                      studentRecords.map((rec) => (
                        <div key={rec.id} className="py-3 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-semibold text-slate-800">
                              Presensi {rec.type === 'masuk' ? 'Masuk Sekolah' : 'Pulang Sekolah'}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Tanggal: {rec.date} · Pukul{' '}
                              <span className="font-mono tabular-nums">{rec.timeStr} WIB</span>
                            </div>
                          </div>
                          <span
                            className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                              rec.status === 'tepat_waktu'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {rec.status === 'tepat_waktu' ? 'Tepat Waktu' : 'Terlambat'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Monthly Stats Summary (5 Cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                    Ringkasan Presensi Terdata
                  </h3>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-slate-500 text-[11px]">Hadir Tepat Waktu</div>
                      <div className="text-lg font-bold font-mono text-emerald-600 mt-1">
                        {studentRecords.filter((r) => r.status === 'tepat_waktu').length} Sesi
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-slate-500 text-[11px]">Terlambat</div>
                      <div className="text-lg font-bold font-mono text-amber-600 mt-1">
                        {studentRecords.filter((r) => r.status === 'terlambat').length} Sesi
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-slate-500 text-[11px]">Izin Resmi</div>
                      <div className="text-lg font-bold font-mono text-purple-600 mt-1">
                        {studentRecords.filter((r) => r.status === 'izin').length} Hari
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="text-slate-500 text-[11px]">Sakit</div>
                      <div className="text-lg font-bold font-mono text-blue-600 mt-1">
                        {studentRecords.filter((r) => r.status === 'sakit').length} Hari
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Online Leave Application Form */
            <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-2xl mx-auto shadow-2xs">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
                <FileText className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Pengajuan Surat Izin / Sakit Online
                  </h3>
                  <p className="text-xs text-slate-500">
                    Surat izin akan langsung diterima oleh pihak sekolah dan tercatat di dashboard absensi.
                  </p>
                </div>
              </div>

              {leaveSuccessMsg ? (
                <div className="py-8 text-center text-emerald-700 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm">Pengajuan Izin Berhasil Terkirim!</h4>
                  <p className="text-xs text-slate-500">
                    Pemberitahuan telah dicatat di sistem sekolah.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleLeaveSubmit} className="mt-4 space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Jenis Keterangan
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="leaveType"
                          value="izin"
                          checked={leaveType === 'izin'}
                          onChange={() => setLeaveType('izin')}
                          className="text-indigo-600"
                        />
                        <span className="font-medium text-slate-800">Izin (Keperluan Acara/Keluarga)</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="leaveType"
                          value="sakit"
                          checked={leaveType === 'sakit'}
                          onChange={() => setLeaveType('sakit')}
                          className="text-indigo-600"
                        />
                        <span className="font-medium text-slate-800">Sakit (Kondisi Medis)</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Mulai Tanggal</label>
                      <input
                        type="date"
                        value={leaveDateStart}
                        onChange={(e) => setLeaveDateStart(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Sampai Tanggal</label>
                      <input
                        type="date"
                        value={leaveDateEnd}
                        onChange={(e) => setLeaveDateEnd(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Alasan / Keterangan Lengkap
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Jelaskan alasan izin atau kondisi sakit ananda..."
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim Pengajuan Izin ke Sekolah</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

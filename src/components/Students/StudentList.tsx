import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  QrCode,
  Printer,
  Trash2,
  Edit,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  FileSpreadsheet,
  Download,
  Upload,
  UserCheck,
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { Student } from '../../types/attendance';
import { generateQrDataUrl } from '../../utils/qrCode';

interface StudentListProps {
  onScanStudentDirectly: (qrPayload: string) => void;
}

export const StudentList: React.FC<StudentListProps> = ({ onScanStudentDirectly }) => {
  const { students, addStudent, importStudentsBatch, updateStudent, deleteStudent, settings } =
    useAttendance();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<Student | null>(null);
  const [cardQrDataUrl, setCardQrDataUrl] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form states for Add/Edit
  const [formData, setFormData] = useState({
    name: '',
    nisn: '',
    nis: '',
    class: 'X MIPA 1',
    gender: 'L' as 'L' | 'P',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    avatarUrl: '',
    status: 'aktif' as 'aktif' | 'non-aktif',
  });

  const classes = Array.from(new Set(students.map((s) => s.class))).sort();

  // Generate QR Data URL whenever selected student changes
  useEffect(() => {
    if (selectedStudentForCard) {
      generateQrDataUrl(selectedStudentForCard.qrCodeData).then((url) => {
        setCardQrDataUrl(url);
      });
    } else {
      setCardQrDataUrl('');
    }
  }, [selectedStudentForCard]);

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nisn.includes(searchQuery) ||
      s.parentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === 'all' || s.class === selectedClass;
    return matchesSearch && matchesClass;
  });

  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      nisn: '',
      nis: '',
      class: classes[0] || 'X-1',
      gender: 'L',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      avatarUrl: '',
      status: 'aktif',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      nisn: student.nisn,
      nis: student.nis,
      class: student.class,
      gender: student.gender,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      parentEmail: student.parentEmail || '',
      avatarUrl: student.avatarUrl,
      status: student.status,
    });
    setIsAddModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.nisn.trim()) return;

    if (editingStudent) {
      updateStudent({
        ...editingStudent,
        ...formData,
      });
    } else {
      addStudent({
        ...formData,
      });
    }
    setIsAddModalOpen(false);
  };

  // Download template CSV for school admin
  const handleDownloadTemplate = () => {
    const header = 'NISN,NIS,Nama_Lengkap,Kelas,Jenis_Kelamin,Nama_Wali,No_WhatsApp_Wali\n';
    const sample = '0081234567,24001,Rayhan Pratama,X-1,L,Bambang Pratama,081234567890\n0081234568,24002,Aisyah Maharani,X-1,P,Siti Rahayu,081298765432\n';
    const blob = new Blob([header + sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'format_impor_siswa.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Parse CSV File
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length <= 1) {
          setImportStatus('File CSV kosong atau tidak memiliki baris data.');
          return;
        }

        const newStudentsList: Array<Omit<Student, 'id' | 'qrCodeData'>> = [];
        // Skip header
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(',').map((item) => item.trim().replace(/^"|"$/g, ''));
          if (row.length >= 7 && row[0]) {
            newStudentsList.push({
              nisn: row[0],
              nis: row[1] || row[0],
              name: row[2],
              class: row[3] || 'Umum',
              gender: row[4].toUpperCase() === 'P' ? 'P' : 'L',
              parentName: row[5] || 'Orang Tua',
              parentPhone: row[6] || '',
              avatarUrl: '',
              status: 'aktif',
            });
          }
        }

        if (newStudentsList.length === 0) {
          setImportStatus('Format kolom tidak cocok. Pastikan menggunakan format template CSV.');
          return;
        }

        const addedCount = importStudentsBatch(newStudentsList);
        setImportStatus(`Berhasil mengimpor ${addedCount} data siswa baru!`);
        setTimeout(() => {
          setIsImportModalOpen(false);
          setImportStatus(null);
        }, 1500);
      } catch (err) {
        setImportStatus('Gagal membaca file CSV. Pastikan format file sesuai template.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Manajemen Data Siswa</span>
            <span aria-hidden="true">·</span>
            <span>Kartu Pelajar & Kode QR</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Data Siswa & Kartu Digital
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Impor Data Siswa (CSV)</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Siswa Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      {students.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 my-6">
          <div className="relative flex-1 w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, NISN, atau wali..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 font-medium"
            >
              <option value="all">Semua Kelas ({students.length} Siswa)</option>
              {classes.map((cls) => (
                <option key={cls} value={cls}>
                  Kelas {cls} ({students.filter((s) => s.class === cls).length})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Empty State when zero students registered */}
      {students.length === 0 ? (
        <div className="my-12 p-12 bg-white rounded-2xl border border-dashed border-slate-300 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Belum Ada Siswa Terdaftar</h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Sistem presensi HadirSiswa berjalan secara langsung tanpa data demo. Tambahkan siswa pertama Anda atau impor file CSV daftar siswa sekolah untuk mulai mencetak kartu dan memindai presensi.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleOpenAddModal}
              className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Siswa Manual</span>
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Impor dari File CSV</span>
            </button>
          </div>
        </div>
      ) : (
        /* Student Grid Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-all shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-lg bg-indigo-50 border border-slate-100 flex items-center justify-center font-bold text-indigo-700 shrink-0 overflow-hidden">
                    {student.avatarUrl ? (
                      <img
                        src={student.avatarUrl}
                        alt={student.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span>{student.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-slate-900 truncate">
                      {student.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                      <span className="font-medium text-indigo-700">{student.class}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">NISN: {student.nisn}</span>
                    </div>
                  </div>
                </div>

                {/* Parent Info Strip */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-[11px] text-slate-400">Wali Murid</span>
                    <span className="font-medium">{student.parentName || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 mt-1">
                    <span className="text-[11px] text-slate-400">No. WhatsApp</span>
                    <span className="font-mono tabular-nums font-medium text-emerald-700">
                      {student.parentPhone || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedStudentForCard(student)}
                  className="flex-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Lihat Kartu & QR</span>
                </button>

                <button
                  onClick={() => handleOpenEditModal(student)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Edit Data Siswa"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Hapus data siswa ${student.name}?`)) {
                      deleteStudent(student.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Hapus Siswa"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CSV Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Impor Data Siswa Sekaligus (CSV)</h3>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportStatus(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              Unggah file CSV yang berisi daftar siswa sekolah Anda. Setiap siswa yang diimpor akan langsung dibuatkan kode QR presensi otomatis.
            </p>

            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-800">Unduh Format Contoh CSV</div>
                <div className="text-[11px] text-slate-500">Gunakan sebagai panduan kolom data</div>
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Format</span>
              </button>
            </div>

            {importStatus && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs">
                {importStatus}
              </div>
            )}

            <div className="mt-6 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-6 text-center">
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={handleCsvFileUpload}
                className="hidden"
              />
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Pilih File CSV Siswa
              </button>
              <span className="text-[11px] text-slate-400 mt-2">Format: .csv (Comma Delimited)</span>
            </div>
          </div>
        </div>
      )}

      {/* Digital Student ID Card Modal */}
      {selectedStudentForCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 no-print">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>Kartu Pelajar Digital Resmi</span>
              </div>
              <button
                onClick={() => setSelectedStudentForCard(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Printable ID Card Container */}
            <div
              id="student-id-card-print"
              className="my-4 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden border border-indigo-700/50"
            >
              {/* Header Badge */}
              <div className="flex items-center justify-between pb-3 border-b border-white/15">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white text-indigo-900 flex items-center justify-center font-bold text-xs">
                    HS
                  </div>
                  <div>
                    <div className="font-bold text-xs uppercase tracking-wider leading-tight">
                      {settings.schoolName}
                    </div>
                    <div className="text-[10px] text-indigo-200">
                      KARTU TANDA PELAJAR · TA {settings.academicYear}
                    </div>
                  </div>
                </div>
                <ShieldCheck className="w-5 h-5 text-indigo-300 opacity-80" />
              </div>

              {/* Student Body Info */}
              <div className="flex items-center gap-4 my-4">
                <div className="w-20 h-24 rounded-lg bg-slate-800 border-2 border-white shadow-sm shrink-0 flex items-center justify-center font-bold text-2xl text-white overflow-hidden">
                  {selectedStudentForCard.avatarUrl ? (
                    <img
                      src={selectedStudentForCard.avatarUrl}
                      alt={selectedStudentForCard.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>{selectedStudentForCard.name.charAt(0)}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-white leading-tight">
                    {selectedStudentForCard.name}
                  </h3>
                  <div className="text-xs text-indigo-200 mt-1">
                    Kelas: <span className="font-semibold text-white">{selectedStudentForCard.class}</span>
                  </div>
                  <div className="text-xs text-indigo-200 font-mono tabular-nums">
                    NISN: <span className="text-white">{selectedStudentForCard.nisn}</span>
                  </div>
                  <div className="text-xs text-indigo-200 font-mono tabular-nums">
                    NIS: <span className="text-white">{selectedStudentForCard.nis}</span>
                  </div>
                </div>
              </div>

              {/* QR Code and Barcode Box */}
              <div className="bg-white rounded-xl p-3 flex items-center justify-between gap-3 text-slate-900">
                <div className="flex-1 text-[10px] text-slate-600">
                  <div className="font-bold text-slate-800 uppercase tracking-wider text-[9px]">
                    KODE VERIFIKASI PRESENSI
                  </div>
                  <div className="font-mono text-[9px] text-slate-500 mt-0.5 truncate">
                    {selectedStudentForCard.qrCodeData}
                  </div>
                  <div className="mt-1.5 text-[9px] text-slate-500">
                    Arahkan kode ini ke kamera gerbang sekolah saat datang dan pulang.
                  </div>
                </div>

                {cardQrDataUrl ? (
                  <img
                    src={cardQrDataUrl}
                    alt="QR Code Siswa"
                    className="w-20 h-20 shrink-0 rounded border border-slate-200"
                  />
                ) : (
                  <div className="w-20 h-20 bg-slate-100 flex items-center justify-center text-slate-400">
                    <QrCode className="w-8 h-8" />
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 no-print">
              <button
                onClick={() => {
                  onScanStudentDirectly(selectedStudentForCard.qrCodeData);
                  setSelectedStudentForCard(null);
                }}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Uji Presensi Sekarang</span>
              </button>

              <button
                onClick={handlePrintCard}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Kartu</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Nomor WhatsApp wali murid akan digunakan untuk notifikasi presensi otomatis secara real-time.
            </p>

            <form onSubmit={handleSaveStudent} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap Siswa"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">NISN (10 Digit)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 0081294819"
                    value={formData.nisn}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">NIS Sekolah</label>
                  <input
                    type="text"
                    placeholder="Contoh: 24106"
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Kelas</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: X-1, VII-A, XII MIPA 1"
                    value={formData.class}
                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value as 'L' | 'P' })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Nama Orang Tua / Wali
                  </label>
                  <input
                    type="text"
                    placeholder="Nama Orang Tua / Wali"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    No. WhatsApp Orang Tua
                  </label>
                  <input
                    type="tel"
                    placeholder="Contoh: 081289123456"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">URL Foto Profil Siswa (Opsional)</label>
                <input
                  type="url"
                  placeholder="https://... (Opsional)"
                  value={formData.avatarUrl}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
                >
                  {editingStudent ? 'Simpan Perubahan' : 'Tambahkan Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

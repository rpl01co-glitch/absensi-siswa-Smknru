import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import confetti from 'canvas-confetti';
import {
  Camera,
  CameraOff,
  RefreshCw,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Send,
  ExternalLink,
  UserCheck,
  Clock,
  UserPlus,
} from 'lucide-react';
import { useAttendance } from '../../context/AttendanceContext';
import { AttendanceType } from '../../types/attendance';
import { getWhatsAppDirectUrl } from '../../utils/whatsapp';

interface ScannerViewProps {
  isKioskMode?: boolean;
  onExitKiosk?: () => void;
  onNavigateToStudents?: () => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  isKioskMode = false,
  onExitKiosk,
  onNavigateToStudents,
}) => {
  const {
    students,
    records,
    settings,
    scanAttendance,
    recentScanResult,
    clearRecentScanResult,
  } = useAttendance();

  const [scanType, setScanType] = useState<AttendanceType>('masuk');
  const [cameraActive, setCameraActive] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [lastFeedback, setLastFeedback] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);
  const [manualInput, setManualInput] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastScannedPayload = useRef<string | null>(null);
  const lastScannedTime = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Digital clock update
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Process scan action
  const handleProcessCode = useCallback(
    (codeData: string) => {
      const now = Date.now();
      // Debounce identical scans within 3 seconds
      if (lastScannedPayload.current === codeData && now - lastScannedTime.current < 3000) {
        return;
      }
      lastScannedPayload.current = codeData;
      lastScannedTime.current = now;

      const result = scanAttendance(codeData, scanType);
      if (result.success && result.data) {
        setLastFeedback({
          type: result.data.record.status === 'terlambat' ? 'warning' : 'success',
          message: result.message,
        });

        // Trigger celebratory confetti if arrived on time
        if (result.data.record.status === 'tepat_waktu') {
          try {
            confetti({
              particleCount: 40,
              spread: 60,
              origin: { y: 0.65 },
            });
          } catch (e) {
            console.warn(e);
          }
        }
      } else {
        setLastFeedback({
          type: 'error',
          message: result.message,
        });
      }
    },
    [scanAttendance, scanType]
  );

  // Scan frame loop using jsQR
  const tick = useCallback(() => {
    if (
      videoRef.current &&
      videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
      canvasRef.current
    ) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          handleProcessCode(code.data);
        }
      }
    }
    animationFrameId.current = requestAnimationFrame(tick);
  }, [handleProcessCode]);

  // Camera start/stop
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      if (!cameraActive) return;
      setCameraError(null);

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Kamera tidak didukung oleh peramban ini.');
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
          animationFrameId.current = requestAnimationFrame(tick);
        }
      } catch (err: unknown) {
        console.warn('Camera access issue:', err);
        const errMsg =
          err instanceof Error
            ? err.message
            : 'Izin kamera tidak diberikan atau perangkat kamera tidak terdeteksi.';
        setCameraError(errMsg);
      }
    }

    startCamera();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [cameraActive, facingMode, tick]);

  // Handle uploaded image file
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const ctx = tempCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            handleProcessCode(code.data);
          } else {
            setLastFeedback({
              type: 'error',
              message: 'Kode QR tidak terdeteksi pada gambar yang diunggah.',
            });
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Manual input submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleProcessCode(manualInput.trim());
    setManualInput('');
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayScans = records.filter((r) => r.date === todayStr);

  return (
    <div
      className={`min-h-[calc(100vh-4rem)] flex flex-col ${
        isKioskMode ? 'fixed inset-0 z-50 bg-slate-950 text-white' : 'bg-slate-50'
      }`}
    >
      {/* Kiosk Mode Header Bar */}
      {isKioskMode && (
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white">
              HS
            </div>
            <div>
              <div className="font-bold text-sm tracking-tight text-white">{settings.schoolName}</div>
              <div className="text-xs text-slate-400">Mode Kiosk Pemindai Gerbang Otomatis</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="font-mono tabular-nums text-lg font-bold text-indigo-400">
              {currentTime} WIB
            </div>
            <button
              onClick={onExitKiosk}
              className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors"
            >
              Keluar Kiosk
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col">
        {/* Notice if no students yet */}
        {students.length === 0 && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold">Belum Ada Siswa Terdaftar:</span> Sistem berjalan dalam mode murni (tanpa data demo). Daftarkan siswa sekolah Anda atau impor file CSV data siswa untuk mulai memindai presensi.
              </div>
            </div>
            {onNavigateToStudents && (
              <button
                onClick={onNavigateToStudents}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shrink-0 flex items-center gap-1.5 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Tambah Siswa</span>
              </button>
            )}
          </div>
        )}

        {/* Top Control Bar: Mode Presensi + Info Jadwal */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{settings.schoolName}</span>
              <span aria-hidden="true">·</span>
              <span>Tahun Ajaran {settings.academicYear}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{currentTime} WIB</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
              Pemindaian Kode QR Siswa
            </h1>
          </div>

          {/* Interactive Mode Filter Button (Masuk vs Pulang) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-lg">
            <button
              onClick={() => {
                setScanType('masuk');
                clearRecentScanResult();
                setLastFeedback(null);
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                scanType === 'masuk'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Absen Masuk ({settings.checkInStandard} WIB)
            </button>
            <button
              onClick={() => {
                setScanType('pulang');
                clearRecentScanResult();
                setLastFeedback(null);
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                scanType === 'pulang'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Absen Pulang ({settings.checkOutStart} WIB)
            </button>
          </div>
        </div>

        {/* Main Grid: Left Scanner Camera Feed, Right Scan Feedback */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 flex-1 items-start">
          {/* Left Column: Live Camera Video Stream & Controls (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-300 shadow-md aspect-4/3 sm:aspect-16/10 flex items-center justify-center">
              {/* Video Element */}
              <video
                ref={videoRef}
                className={`w-full h-full object-cover ${!cameraActive || cameraError ? 'hidden' : 'block'}`}
                muted
                playsInline
              />

              {/* Hidden Canvas for QR Extraction */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Scanning Target Reticle & Laser Effect */}
              {cameraActive && !cameraError && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                  {/* Subtle dark vignette */}
                  <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/60" />

                  {/* Aiming Reticle Box */}
                  <div className="relative w-64 h-64 sm:w-72 sm:h-72 border-2 border-indigo-400/80 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.25)] flex items-center justify-center overflow-hidden">
                    {/* Corner brackets */}
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-sm" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-sm" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-sm" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-sm" />

                    {/* Animated Scanning Beam Line */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_12px_rgba(129,140,248,1)] animate-bounce" />

                    <div className="absolute bottom-3 text-[11px] font-medium text-white/90 bg-black/60 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                      Arahkan QR Siswa ke Sini
                    </div>
                  </div>
                </div>
              )}

              {/* Camera Fallback / Error State */}
              {(!cameraActive || cameraError) && (
                <div className="p-8 text-center max-w-md">
                  <div className="w-14 h-14 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <CameraOff className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-semibold text-white">
                    {cameraError ? 'Kamera Belum Aktif' : 'Kamera Dimatikan'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {cameraError
                      ? 'Berikan izin akses kamera pada peramban Anda, atau gunakan input NISN dan unggah file QR di bawah.'
                      : 'Kamera sedang non-aktif. Klik tombol untuk menyalakan kembali.'}
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setCameraActive(true);
                        setCameraError(null);
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Nyalakan Kamera</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Overlay Top Controls: Switch Camera & Toggle */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  onClick={() =>
                    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
                  }
                  title="Ganti Kamera Depan/Belakang"
                  className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-colors text-xs flex items-center gap-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline text-[11px]">
                    {facingMode === 'environment' ? 'Kamera Belakang' : 'Kamera Depan'}
                  </span>
                </button>

                <button
                  onClick={() => setCameraActive((prev) => !prev)}
                  title={cameraActive ? 'Matikan Kamera' : 'Nyalakan Kamera'}
                  className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-colors"
                >
                  {cameraActive ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                </button>
              </div>

              {/* Overlay Bottom Status Indicator */}
              <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-xs text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-medium">
                  Mode: Absen {scanType === 'masuk' ? 'Masuk' : 'Pulang'}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-300 text-[11px]">
                  Toleransi: {settings.lateThreshold} WIB
                </span>
              </div>
            </div>

            {/* Quick Actions Strip: Upload Image QR & Manual NISN Input */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Scan dari Foto / Gambar QR</span>
                </button>
              </div>

              <form onSubmit={handleManualSubmit} className="flex items-center gap-1.5 flex-1 max-w-xs">
                <input
                  type="text"
                  placeholder="Ketik NISN Siswa..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shrink-0"
                >
                  Proses
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Instant Scan Confirmation HUD & Real-time Parent Notification Trigger (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Feedback alert banner if any */}
            {lastFeedback && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  lastFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : lastFeedback.type === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                {lastFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : lastFeedback.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 font-medium">{lastFeedback.message}</div>
              </div>
            )}

            {/* Active / Most Recent Scan Result Card */}
            {recentScanResult ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    <span>Hasil Pemindaian Terverifikasi</span>
                  </div>
                  <span className="font-mono tabular-nums text-xs font-semibold text-slate-700">
                    {recentScanResult.record.timeStr} WIB
                  </span>
                </div>

                {/* Student Identity Section */}
                <div className="flex items-center gap-4 my-4">
                  <div className="w-16 h-16 rounded-xl bg-indigo-50 border border-slate-200 flex items-center justify-center font-bold text-lg text-indigo-700 shrink-0">
                    {recentScanResult.student.avatarUrl ? (
                      <img
                        src={recentScanResult.student.avatarUrl}
                        alt={recentScanResult.student.name}
                        className="w-full h-full rounded-xl object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      recentScanResult.student.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      {recentScanResult.student.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span>Kelas {recentScanResult.student.class}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">NISN: {recentScanResult.student.nisn}</span>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          recentScanResult.record.status === 'tepat_waktu'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {recentScanResult.record.status === 'tepat_waktu'
                          ? 'Hadir Tepat Waktu'
                          : 'Terlambat Masuk'}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        Presensi {recentScanResult.record.type === 'masuk' ? 'Masuk' : 'Pulang'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Real-time WhatsApp Parent Notification Dispatch Card */}
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 mt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                        WA
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-emerald-950">
                          Notifikasi WhatsApp Terkirim ke Wali Murid
                        </div>
                        <div className="text-[11px] text-emerald-700">
                          {recentScanResult.student.parentName} (
                          <span className="font-mono tabular-nums">
                            {recentScanResult.student.parentPhone}
                          </span>
                          )
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded">
                      Real-time
                    </span>
                  </div>

                  {/* Message Preview Quote */}
                  <div className="mt-3 p-2.5 bg-white rounded-lg border border-emerald-100 text-[11px] text-slate-700 font-sans leading-relaxed whitespace-pre-line max-h-36 overflow-y-auto">
                    {recentScanResult.notification.message}
                  </div>

                  {/* Direct WhatsApp Action Button */}
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <a
                      href={getWhatsAppDirectUrl(
                        recentScanResult.student.parentPhone,
                        recentScanResult.notification.message
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Buka Chat WhatsApp Ortu</span>
                      <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center flex flex-col items-center justify-center min-h-[240px]">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Menunggu Pemindaian Kartu Siswa
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                  Posisikan kode QR kartu pelajar siswa di depan kamera atau gunakan kolom NISN di sebelah kiri.
                </p>
              </div>
            )}

            {/* Today's Recent Scans Stream */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-900">
                  Aktivitas Presensi Hari Ini ({todayScans.length} Siswa)
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Hari Ini</span>
              </div>

              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {todayScans.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    Belum ada siswa yang melakukan presensi hari ini.
                  </div>
                ) : (
                  todayScans.slice(0, 5).map((record) => (
                    <div key={record.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-800">
                          {record.studentName}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          <span>{record.class}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{record.timeStr}</span>
                          <span aria-hidden="true">·</span>
                          <span>Presensi {record.type}</span>
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                          record.status === 'tepat_waktu'
                            ? 'text-emerald-700 bg-emerald-50'
                            : 'text-amber-700 bg-amber-50'
                        }`}
                      >
                        {record.status === 'tepat_waktu' ? 'Tepat Waktu' : 'Terlambat'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

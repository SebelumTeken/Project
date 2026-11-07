import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { Button } from '../components/Button';
import { TextLink } from '../components/TextLink';
import { useSession } from '../store/session';
import { AiDibatalkanError, analisisLowongan, BATAS_WAKTU_MS } from '../lib/ai';

const PESAN_ERROR_UMUM = 'Koneksi ke AI bermasalah.';
const DETIK_PESAN_LAMBAT = 15;

export const Memeriksa: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    mode,
    setMode,
    apiKey,
    lowongan,
    setLowongan,
    posterMenunggu,
    setPosterMenunggu,
    loadDemoData,
  } = useSession();

  // Failed state can be triggered via query parameter ?failed=1 or error
  const [status, setStatus] = useState<'running' | 'failed'>(
    searchParams.get('failed') === '1' ? 'failed' : 'running'
  );
  const [pesanError, setPesanError] = useState<string>(PESAN_ERROR_UMUM);
  const [percobaan, setPercobaan] = useState<number>(0);
  const [detikBerjalan, setDetikBerjalan] = useState<number>(0);

  const [progressStage, setProgressStage] = useState<number>(1); // 1 = membaca teks, 2 = tanda bahaya, 3 = menyiapkan hasil

  // Nilai sesi terbaru dibaca lewat ref supaya proses tidak diulang saat sesi berubah.
  const sesiRef = useRef({ mode, apiKey, lowongan, posterMenunggu });
  sesiRef.current = { mode, apiKey, lowongan, posterMenunggu };

  useEffect(() => {
    if (status !== 'running') return;

    let aktif = true;
    const controller = new AbortController();
    const timers: ReturnType<typeof setTimeout>[] = [];
    let interval: ReturnType<typeof setInterval> | undefined;

    const gagal = (pesan: string) => {
      if (!aktif) return;
      setPesanError(pesan);
      setStatus('failed');
    };

    const jalankanPemeriksaan = () => {
      const sesi = sesiRef.current;

      if (sesi.mode === 'ai') {
        if (!sesi.posterMenunggu) {
          // Tidak ada poster baru. Jika sudah ada hasil (misalnya dari "Pakai contoh"), tampilkan.
          if (sesi.lowongan) {
            navigate('/lowongan/hasil', { replace: true });
          } else {
            gagal('Belum ada poster yang diunggah. Unggah poster lowongan dulu.');
          }
          return;
        }

        if (!sesi.apiKey.trim()) {
          gagal('Kunci API Groq belum diisi. Buka Pengaturan untuk mengisinya.');
          return;
        }

        const poster = sesi.posterMenunggu;
        const mulai = Date.now();
        setProgressStage(1);
        setDetikBerjalan(0);
        interval = setInterval(() => {
          setDetikBerjalan(Math.floor((Date.now() - mulai) / 1000));
        }, 1000);

        analisisLowongan(sesi.apiKey, poster.gambarData, { signal: controller.signal })
          .then((hasil) => {
            if (!aktif) return;
            setProgressStage(3);
            setLowongan({ ...hasil, nama_file: poster.namaFile });
            setPosterMenunggu(null);
            navigate('/lowongan/hasil', { replace: true });
          })
          .catch((error: unknown) => {
            if (error instanceof AiDibatalkanError) return;
            gagal(error instanceof Error ? error.message : PESAN_ERROR_UMUM);
          })
          .finally(() => clearInterval(interval));
        return;
      }

      // Mode Contoh: animasi singkat, lalu tampilkan hasil.
      if (!sesi.lowongan) {
        loadDemoData(['lowongan']);
      }
      timers.push(
        setTimeout(() => aktif && setProgressStage(2), 800),
        setTimeout(() => aktif && setProgressStage(3), 1500),
        setTimeout(() => aktif && navigate('/lowongan/hasil', { replace: true }), 2000)
      );
    };

    // Ditunda satu tick: React StrictMode (mode dev) memasang efek dua kali,
    // jadi pemasangan pertama dibatalkan sebelum sempat mengirim permintaan ke Groq.
    const mulaiTimer = setTimeout(jalankanPemeriksaan, 0);

    return () => {
      aktif = false;
      clearTimeout(mulaiTimer);
      timers.forEach((timer) => clearTimeout(timer));
      clearInterval(interval);
      controller.abort();
    };
  }, [status, percobaan, navigate, loadDemoData, setLowongan, setPosterMenunggu]);

  const handleCobaLagi = () => {
    setPesanError(PESAN_ERROR_UMUM);
    setProgressStage(1);
    setDetikBerjalan(0);
    setStatus('running');
    setPercobaan((n) => n + 1);
  };

  const handlePakaiContoh = () => {
    // Pindah ke Mode Contoh supaya tahap berikutnya juga tidak bergantung pada AI.
    setMode('contoh');
    loadDemoData(['lowongan']);
    navigate('/lowongan/hasil');
  };

  const batasDetik = Math.round(BATAS_WAKTU_MS.analisisLowongan / 1000);

  return (
    <AppLayout stepText="1 dari 3" isDemo={mode === 'contoh'}>
      {/* Sub-Header Step Bar */}
      <div className="w-full bg-background border-b border-divider/20">
        <div className="max-w-[1040px] mx-auto px-4 sm:px-10 h-11 flex items-center justify-between text-sm">
          <span className="font-normal text-[14px] leading-5 tracking-[-0.35px] text-text select-none">
            Cek Lowongan
          </span>
          <span className="font-semibold text-[12px] leading-4 tracking-[1.2px] uppercase text-secondary select-none">
            1 DARI 3
          </span>
          <TextLink to="/lowongan" className="text-sm font-normal text-nav">
            Kembali
          </TextLink>
        </div>
      </div>

      <div className="w-full flex-1 flex flex-col items-center justify-center px-4 sm:px-10 py-10 sm:py-16 md:py-24">
        {status === 'running' ? (
          <div className="w-full max-w-[680px] flex flex-col items-center text-center">
            {/* Heading 1 */}
            <h1 className="w-full max-w-[620px] font-semibold text-4xl sm:text-6xl md:text-[72px] leading-tight md:leading-[76px] tracking-[-2.16px] text-text">
              Sedang membaca.
            </h1>

            {/* Thin Progressbar (480px, 4px height) */}
            <div className="mt-10 w-full max-w-[480px] h-1 bg-divider/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-700 ease-out"
                style={{
                  width:
                    progressStage === 1
                      ? '35%'
                      : progressStage === 2
                      ? '61.6%'
                      : '95%',
                }}
              />
            </div>

            {/* Three Status Lines */}
            <div className="mt-12 flex flex-col items-center">
              {/* Line 1: Membaca teks */}
              <div className="flex items-center justify-center gap-2 h-[22px]">
                <span className="font-medium text-[17px] leading-[22px] tracking-[-0.085px] text-text">
                  Membaca teks
                </span>
                {progressStage >= 2 && (
                  <span
                    className="font-semibold text-[15px] leading-[22px] text-success select-none"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                )}
              </div>

              {/* Line 2: Mencocokkan tanda bahaya */}
              <div className="mt-3.5 flex items-center justify-center gap-2 h-[22px]">
                <span
                  className={`font-medium text-[17px] leading-[22px] tracking-[-0.085px] transition-colors ${
                    progressStage >= 2 ? 'text-text' : 'text-secondary'
                  }`}
                >
                  Mencocokkan tanda bahaya
                </span>
                {progressStage >= 3 && (
                  <span
                    className="font-semibold text-[15px] leading-[22px] text-success select-none"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                )}
              </div>

              {/* Line 3: Menyiapkan hasil */}
              <div className="mt-3.5 flex items-center justify-center gap-2 h-[22px]">
                <span
                  className={`font-medium text-[17px] leading-[22px] tracking-[-0.085px] transition-colors ${
                    progressStage >= 3 ? 'text-text' : 'text-secondary'
                  }`}
                >
                  Menyiapkan hasil
                </span>
              </div>
            </div>

            {/* Waktu tunggu respons AI */}
            {mode === 'ai' && (
              <p className="mt-8 font-normal text-[14px] leading-5 text-secondary" aria-live="polite">
                Menunggu respons AI · {detikBerjalan} detik
                {detikBerjalan >= DETIK_PESAN_LAMBAT && (
                  <>
                    <br />
                    Masih diproses. Dihentikan otomatis setelah {batasDetik} detik.
                  </>
                )}
              </p>
            )}

            {/* Link Batal */}
            <div className="mt-16">
              <TextLink to="/lowongan">Batal</TextLink>
            </div>

            {/* Bottom Info Box */}
            <div className="mt-16 sm:mt-24 pt-8 w-full max-w-[480px] flex flex-col items-center text-center">
              <span className="font-semibold text-[12px] leading-4 tracking-[1.2px] uppercase text-secondary">
                DIBANTU AI
              </span>
              <p className="mt-2 max-w-[380px] font-normal text-[14px] leading-5 text-nav">
                Poster diperiksa langsung dan tidak disimpan di server kami.
              </p>
            </div>
          </div>
        ) : (
          /* Failed State */
          <div className="w-full max-w-[620px] flex flex-col items-center text-center">
            <h1 className="font-semibold text-4xl sm:text-6xl md:text-[72px] leading-tight md:leading-[76px] tracking-[-2.16px] text-text">
              Belum berhasil.
            </h1>
            <p
              className="mt-6 font-normal text-[17px] sm:text-[19px] leading-7 text-secondary"
              role="alert"
            >
              {pesanError}
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              {posterMenunggu && apiKey.trim() ? (
                <Button onClick={handleCobaLagi}>Coba lagi</Button>
              ) : (
                <Button to={apiKey.trim() ? '/lowongan' : '/pengaturan'}>
                  {apiKey.trim() ? 'Unggah poster' : 'Buka Pengaturan'}
                </Button>
              )}
              <TextLink onClick={handlePakaiContoh}>Pakai Mode Contoh</TextLink>
            </div>

            {posterMenunggu && (
              <div className="mt-6">
                <TextLink to="/lowongan" className="text-sm font-normal text-nav">
                  Unggah gambar lain
                </TextLink>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

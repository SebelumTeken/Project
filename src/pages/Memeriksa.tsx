import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { Button } from '../components/Button';
import { TextLink } from '../components/TextLink';
import { useSession } from '../store/session';
import { analisisLowongan } from '../lib/ai';

export const Memeriksa: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { mode, apiKey, lowongan, setLowongan, loadDemoData } = useSession();
  const sudahDimulai = useRef<boolean>(false);

  // Failed state can be triggered via query parameter ?failed=1 or error
  const [status, setStatus] = useState<'running' | 'failed'>(
    searchParams.get('failed') === '1' ? 'failed' : 'running'
  );

  const [progressStage, setProgressStage] = useState<number>(1); // 1 = membaca teks, 2 = tanda bahaya, 3 = menyiapkan hasil

  useEffect(() => {
    if (status !== 'running' || sudahDimulai.current) return;
    sudahDimulai.current = true;
    let active = true;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const jalankanPemeriksaan = async () => {
      if (mode === 'ai') {
        if (lowongan && !lowongan.gambar_data) {
          navigate('/lowongan/hasil');
          return;
        }

        if (!apiKey.trim() || !lowongan?.gambar_data) {
          if (active) setStatus('failed');
          return;
        }

        try {
          setProgressStage(2);
          const hasil = await analisisLowongan(apiKey, lowongan.gambar_data);
          if (!active) return;
          setProgressStage(3);
          setLowongan(hasil);
          navigate('/lowongan/hasil');
        } catch {
          if (active) setStatus('failed');
        }
        return;
      }

      if (!lowongan) {
        loadDemoData();
      }

      const t1 = setTimeout(() => {
        if (active) setProgressStage(2);
      }, 800);
      const t2 = setTimeout(() => {
        if (active) setProgressStage(3);
      }, 1500);
      const t3 = setTimeout(() => {
        if (active) navigate('/lowongan/hasil');
      }, 2000);
      timers.push(t1, t2, t3);
    };

    void jalankanPemeriksaan();

    return () => {
      active = false;
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [
    apiKey,
    loadDemoData,
    lowongan,
    mode,
    navigate,
    setLowongan,
    status,
  ]);

  const handleCobaLagi = () => {
    sudahDimulai.current = false;
    setStatus('running');
    setProgressStage(1);
  };

  const handlePakaiContoh = () => {
    loadDemoData();
    navigate('/lowongan/hasil');
  };

  return (
    <AppLayout stepText="1 dari 3">
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

      <div className="w-full flex-1 flex flex-col items-center justify-center px-4 sm:px-10 py-16 md:py-24">
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
                <span
                  className="font-semibold text-[15px] leading-[22px] text-success select-none"
                  aria-hidden="true"
                >
                  ✓
                </span>
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
                {progressStage >= 2 && (
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
                {progressStage >= 3 && (
                  <span
                    className="font-semibold text-[15px] leading-[22px] text-success select-none"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                )}
              </div>
            </div>

            {/* Link Batal */}
            <div className="mt-16">
              <TextLink to="/lowongan">Batal</TextLink>
            </div>

            {/* Bottom Info Box */}
            <div className="mt-24 pt-8 w-full max-w-[480px] flex flex-col items-center text-center">
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
            <p className="mt-6 font-normal text-[17px] sm:text-[19px] leading-7 text-secondary">
              Koneksi ke AI bermasalah.
            </p>

            <div className="mt-10 flex flex-row items-center justify-center gap-6">
              <Button onClick={handleCobaLagi}>Coba lagi</Button>
              <TextLink onClick={handlePakaiContoh}>Pakai contoh</TextLink>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

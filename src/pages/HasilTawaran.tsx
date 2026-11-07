import React, { useEffect } from 'react';
import { AppLayout } from '../components/AppLayout';
import { Button } from '../components/Button';
import { TextLink } from '../components/TextLink';
import { useSession } from '../store/session';
import { hitungPatokanUpah, UMP_SUMBAR_2026 } from '../lib/upah';

export const HasilTawaran: React.FC = () => {
  const { mode, tawaran, loadDemoData } = useSession();

  useEffect(() => {
    if (!tawaran) {
      loadDemoData();
    }
  }, [tawaran, loadDemoData]);

  const activeTawaran = tawaran ?? {
    gaji_bulanan: 2800000,
    jenis_pekerjaan: 'penuh_waktu' as const,
    skala_usaha: 'menengah_besar' as const,
    masa_kerja_kurang_1_tahun: true,
    nominal_patokan: UMP_SUMBAR_2026,
    selisih_patokan: 2800000 - UMP_SUMBAR_2026,
    posisi_patokan: 'di_bawah' as const,
    pertanyaan: [
      'Ini gaji masa percobaan?',
      'Ada tunjangan tetap?',
      'Kapan gaji ditinjau?',
    ],
  };

  const calculation = hitungPatokanUpah({
    gajiBulanan: activeTawaran.gaji_bulanan,
    jenisPekerjaan: activeTawaran.jenis_pekerjaan,
    skalaUsaha: activeTawaran.skala_usaha,
    masaKerjaKurang1Tahun: activeTawaran.masa_kerja_kurang_1_tahun,
  });

  const isBelow = calculation.posisi === 'di_bawah';
  const isAbove = calculation.posisi === 'di_atas';
  const isEqual = calculation.posisi === 'setara';

  const positionColorClass = isBelow
    ? 'text-warning'
    : isAbove
    ? 'text-success'
    : isEqual
    ? 'text-text'
    : 'text-warning';

  const formatDifference = (diff: number) => {
    if (diff < 0) {
      return `−Rp${Math.abs(diff).toLocaleString('id-ID')}`;
    }
    if (diff > 0) {
      return `+Rp${diff.toLocaleString('id-ID')}`;
    }
    return 'Rp0';
  };

  const percentage = Math.min(
    Math.max(
      Math.round((activeTawaran.gaji_bulanan / calculation.nominalPatokan) * 100),
      5
    ),
    100
  );

  return (
    <AppLayout stepText="2 dari 3" isDemo={mode === 'contoh'}>
      {/* Sub-Header Context Bar */}
      <div className="w-full bg-background border-b border-divider/20">
        <div className="max-w-[1040px] mx-auto px-4 sm:px-10 h-11 flex items-center justify-between text-sm">
          <span className="font-semibold text-[12px] leading-4 tracking-[1.2px] uppercase text-secondary select-none">
            HASIL PERBANDINGAN
          </span>
          <div className="flex items-center gap-1.5 text-secondary text-sm">
            <span
              className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0"
              aria-hidden="true"
            />
            <span className="font-normal text-[14px] leading-5 select-none">
              {mode === 'contoh' ? 'Data contoh' : 'Analisis AI'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Analysis Canvas (1040px) */}
      <div className="w-full flex-1 flex flex-col items-center px-4 sm:px-10 py-12 md:py-16">
        <div className="w-full max-w-[1040px] flex flex-col items-center">
          {/* Centered Editorial Hierarchy Section */}
          <section className="w-full max-w-[760px] text-center pt-4 pb-14 flex flex-col items-center">
            <span className="font-semibold text-[12px] leading-4 tracking-[1.2px] uppercase text-secondary mb-1">
              POSISI TAWARAN
            </span>

            <h1
              className={`font-semibold text-5xl sm:text-7xl leading-tight md:leading-[76px] tracking-[-1.8px] ${positionColorClass}`}
            >
              {calculation.labelPosisi}
            </h1>

            <p className="mt-2 max-w-[560px] font-normal text-[17px] sm:text-[19px] leading-7 tracking-[-0.095px] text-secondary">
              Berdasarkan upah minimum Provinsi Sumatera Barat tahun 2026 untuk
              pekerja penuh waktu dengan masa kerja kurang dari 1 tahun.
            </p>
          </section>

          {/* Dual Balanced Analytic Panels (Side by Side Grid, 1040px max, 32px gap) */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 items-start mb-12 sm:mb-16">
            {/* Left Panel: Quantitative Difference & Benchmark Gauge */}
            <article className="w-full md:min-h-[640px] p-6 sm:p-10 bg-surface rounded-3xl flex flex-col justify-between">
              <div>
                <span className="font-semibold text-[12px] leading-4 tracking-[1.2px] uppercase text-secondary mb-2 block">
                  SELISIH NOMINAL
                </span>

                <div className="flex items-baseline">
                  <span
                    className={`font-semibold text-[34px] sm:text-[46px] leading-[44px] sm:leading-[52px] break-words tracking-[-1.2px] ${positionColorClass}`}
                  >
                    {formatDifference(calculation.selisih)}
                  </span>
                </div>

                <p className="mt-1 font-normal text-[14px] leading-5 text-secondary">
                  dari UMP Sumatera Barat 2026
                </p>

                {/* Comparison Rows */}
                <div className="mt-9 flex flex-col gap-4">
                  {/* Row 1: Tawaran */}
                  <div className="w-full min-h-11 py-2 px-4 bg-background rounded-2xl flex items-center justify-between gap-3">
                    <span className="font-normal text-[16px] leading-[25px] tracking-[-0.051px] text-secondary">
                      Tawaran
                    </span>
                    <span className="font-semibold text-[17px] sm:text-[20px] leading-7 tracking-[-0.55px] text-text tabular-nums">
                      Rp{activeTawaran.gaji_bulanan.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Row 2: Patokan UMP */}
                  <div className="w-full min-h-11 py-2 px-4 bg-background rounded-2xl flex items-center justify-between gap-3">
                    <span className="font-normal text-[16px] leading-[25px] tracking-[-0.051px] text-secondary">
                      Patokan UMP
                    </span>
                    <span className="font-semibold text-[17px] sm:text-[20px] leading-7 tracking-[-0.55px] text-text tabular-nums">
                      Rp{calculation.nominalPatokan.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Proportional Metric Bar */}
              <div className="pt-10">
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className={`font-medium text-[14px] leading-5 ${positionColorClass}`}>
                    Tawaran ({percentage}%)
                  </span>
                  <span className="font-normal text-[14px] leading-5 text-secondary">
                    Patokan UMP
                  </span>
                </div>

                {/* Track */}
                <div className="relative w-full h-3 bg-divider/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isBelow
                        ? 'bg-warning'
                        : isAbove
                        ? 'bg-success'
                        : 'bg-accent'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="mt-1 flex items-center justify-between text-xs text-secondary font-semibold tracking-[0.48px]">
                  <span>Rp0</span>
                  <span>Rp{calculation.nominalPatokan.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </article>

            {/* Right Panel: Strategic Clarifications */}
            <article className="w-full md:min-h-[640px] p-6 sm:p-10 bg-surface rounded-3xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-[24px] sm:text-[28px] leading-[34px] tracking-[-0.7px] text-text">
                    Tanyakan
                  </h2>
                  <span className="font-semibold text-[12px] leading-4 tracking-[1.2px] uppercase text-secondary">
                    3 PERTANYAAN
                  </span>
                </div>

                <p className="font-normal text-[17px] leading-[25px] tracking-[-0.051px] text-secondary mb-6">
                  Ajukan pertanyaan terstruktur berikut secara profesional kepada
                  perekrut sebelum menandatangani surat perjanjian:
                </p>

                {/* 3 Question Cards */}
                <div className="flex flex-col gap-4">
                  {/* Card 01 */}
                  <div className="w-full p-4 bg-background rounded-2xl flex items-start gap-4">
                    <span className="font-semibold text-[12px] leading-4 tracking-[0.48px] text-warning mt-1 select-none">
                      01
                    </span>
                    <div className="flex flex-col gap-1">
                      <h3 className="font-medium text-[20px] leading-7 tracking-[-0.55px] text-text">
                        Ini gaji masa percobaan?
                      </h3>
                      <p className="font-normal text-[14px] leading-5 text-secondary">
                        Pastikan klausul mengatur penyesuaian nominal otomatis ke
                        taraf reguler setelah probation 3 bulan berakhir.
                      </p>
                    </div>
                  </div>

                  {/* Card 02 */}
                  <div className="w-full p-4 bg-background rounded-2xl flex items-start gap-4">
                    <span className="font-semibold text-[12px] leading-4 tracking-[0.48px] text-warning mt-1 select-none">
                      02
                    </span>
                    <div className="flex flex-col gap-1">
                      <h3 className="font-medium text-[20px] leading-7 tracking-[-0.55px] text-text">
                        Ada tunjangan tetap?
                      </h3>
                      <p className="font-normal text-[14px] leading-5 text-secondary">
                        Undang-Undang mengizinkan gaji pokok 75% dari total upah
                        jika dilengkapi tunjangan bersifat tetap.
                      </p>
                    </div>
                  </div>

                  {/* Card 03 */}
                  <div className="w-full p-4 bg-background rounded-2xl flex items-start gap-4">
                    <span className="font-semibold text-[12px] leading-4 tracking-[0.48px] text-warning mt-1 select-none">
                      03
                    </span>
                    <div className="flex flex-col gap-1">
                      <h3 className="font-medium text-[20px] leading-7 tracking-[-0.55px] text-text">
                        Kapan gaji ditinjau?
                      </h3>
                      <p className="font-normal text-[14px] leading-5 text-secondary">
                        Tanyakan siklus tahunan evaluasi performa kerja dan
                        penyesuaian terhadap inflasi atau standar UMP baru.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Clarification Directive */}
              <div className="pt-8 flex items-center gap-2 text-secondary text-sm">
                <svg
                  className="w-4 h-4 shrink-0"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="8" cy="8" r="7" />
                  <line x1="8" y1="7.5" x2="8" y2="11.5" />
                  <circle cx="8" cy="4.5" r="0.75" fill="currentColor" />
                </svg>
                <p className="font-normal text-[14px] leading-5">
                  Pertanyaan ini dirancang untuk membuka ruang negosiasi tanpa
                  terkesan menuntut.
                </p>
              </div>
            </article>
          </div>

          {/* Lower Decision Action Area */}
          <section className="w-full flex flex-col items-center text-center">
            <p className="font-normal text-[14px] leading-5 text-secondary mb-4">
              Patokan awal. Ada pengecualian.
            </p>

            <Button to="/latihan" className="!w-[130px] !min-w-[130px] !px-0">
              Latihan
            </Button>

            <div className="mt-4">
              <TextLink to="/tawaran" className="text-sm font-normal text-accent-strong">
                Ubah nominal atau konteks tawaran
              </TextLink>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

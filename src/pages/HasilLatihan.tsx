import React, { useEffect } from 'react';
import { AppLayout } from '../components/AppLayout';
import { Button } from '../components/Button';
import { TextLink } from '../components/TextLink';
import { useSession } from '../store/session';

// Demo fallback scores
const DEMO_EVALUASI = {
  skor_kejelasan: 4,
  skor_alasan: 3,
  skor_kesopanan: 5,
  total_skor: 12,
  maksimal_skor: 15,
  masukan:
    'Permintaanmu sudah jelas, tetapi tambahkan alasan yang berkaitan dengan tanggung jawab pekerjaan.',
  contoh_kalimat: 'Sesuai tanggung jawabnya, apakah gaji bisa ditinjau?',
};

const SUBTEXT =
  'Evaluasi percakapan simulasi negosiasi berdasarkan kejelasan argumen, alasan objektif, dan kesopanan penyampaian.';

const SUBTEXT_SUGGESTION =
  'Menghubungkan kompensasi langsung dengan bobot lingkup kerja membuka ruang evaluasi objektif.';

export const HasilLatihan: React.FC = () => {
  const { mode, evaluasi, loadDemoData } = useSession();

  useEffect(() => {
    if (!evaluasi) {
      loadDemoData();
    }
  }, [evaluasi, loadDemoData]);

  const activeEvaluasi = evaluasi ?? DEMO_EVALUASI;

  const scores = [
    { label: 'Kejelasan', value: activeEvaluasi.skor_kejelasan, max: 5 },
    { label: 'Alasan', value: activeEvaluasi.skor_alasan, max: 5 },
    { label: 'Kesopanan', value: activeEvaluasi.skor_kesopanan, max: 5 },
  ];

  return (
    <AppLayout stepText="3 dari 3" isDemo={mode === 'contoh'}>
      {/* Sub-Header Step Context Bar */}
      <div className="w-full bg-background border-b border-divider/20">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-10 h-11 flex items-center gap-1 text-sm">
          <span className="font-semibold text-[12px] leading-4 tracking-[1.2px] uppercase text-nav select-none">
            HASIL LATIHAN
          </span>
          <span
            className="w-1 h-1 rounded-full bg-[#C1C6D5] shrink-0 mx-0.5"
            aria-hidden="true"
          />
          <span className="font-medium text-[12px] leading-4 tracking-[1.2px] uppercase text-secondary select-none">
            3 DARI 3
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full flex-1 flex flex-col items-center px-4 sm:px-10 py-10 sm:py-16 md:py-20 bg-[#F9F9FB]">
        <div className="w-full max-w-[1120px] flex flex-col items-center">

          {/* Centered Headline Section */}
          <section className="w-full max-w-[680px] flex flex-col items-center text-center mb-10 sm:mb-16 gap-3">
            <h1 className="font-semibold text-4xl sm:text-[48px] leading-tight sm:leading-[52px] tracking-[-1.2px] text-text">
              Awal yang baik.
            </h1>
            <p className="font-normal text-[17px] leading-[25px] tracking-[-0.051px] text-secondary max-w-[615px]">
              {SUBTEXT}
            </p>
          </section>

          {/* Score Panel */}
          <div className="w-full max-w-[760px] mb-12 sm:mb-20">
            <div
              className="w-full bg-surface rounded-[24px] sm:rounded-[32px] px-2 py-6 sm:px-12 sm:py-10"
              role="region"
              aria-label="Skor latihan"
            >
              {/* Three scores side-by-side */}
              <div className="flex items-stretch justify-around w-full">
                {/* Score 1: Kejelasan */}
                <div className="flex flex-col flex-1 items-center px-1 sm:px-2">
                  <span className="font-semibold text-[30px] sm:text-[48px] leading-[36px] sm:leading-[52px] tracking-[-1px] sm:tracking-[-1.2px] text-text tabular-nums">
                    {scores[0].value}/{scores[0].max}
                  </span>
                  <span className="mt-1 sm:mt-2 font-medium text-[12px] sm:text-[14px] leading-5 text-secondary text-center">
                    {scores[0].label}
                  </span>
                </div>

                {/* Divider + Score 2: Alasan (middle) */}
                <div className="relative flex flex-col flex-1 items-center px-1 sm:px-2">
                  {/* Left vertical divider */}
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-10 bg-[#E2E2E4]"
                    aria-hidden="true"
                  />
                  <span className="font-semibold text-[30px] sm:text-[48px] leading-[36px] sm:leading-[52px] tracking-[-1px] sm:tracking-[-1.2px] text-text tabular-nums">
                    {scores[1].value}/{scores[1].max}
                  </span>
                  <span className="mt-1 sm:mt-2 font-medium text-[12px] sm:text-[14px] leading-5 text-secondary text-center">
                    {scores[1].label}
                  </span>
                  {/* Right vertical divider */}
                  <div
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-10 bg-[#E2E2E4]"
                    aria-hidden="true"
                  />
                </div>

                {/* Score 3: Kesopanan */}
                <div className="flex flex-col flex-1 items-center px-1 sm:px-2">
                  <span className="font-semibold text-[30px] sm:text-[48px] leading-[36px] sm:leading-[52px] tracking-[-1px] sm:tracking-[-1.2px] text-text tabular-nums">
                    {scores[2].value}/{scores[2].max}
                  </span>
                  <span className="mt-1 sm:mt-2 font-medium text-[12px] sm:text-[14px] leading-5 text-secondary text-center">
                    {scores[2].label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation Section */}
          <section
            className="w-full max-w-[610px] flex flex-col items-center text-center gap-3 mb-12 sm:mb-20"
            aria-label="Saran kalimat negosiasi"
          >
            {/* Label */}
            <span className="font-semibold text-[12px] leading-4 tracking-[1.2px] uppercase text-secondary">
              COBA KALIMAT INI
            </span>

            {/* Blockquote suggestion */}
            <blockquote className="font-medium text-[22px] leading-9 tracking-[-0.22px] text-text text-center">
              &ldquo;{activeEvaluasi.contoh_kalimat}&rdquo;
            </blockquote>

            {/* Explanation subtext */}
            <p className="font-normal text-[14px] leading-5 text-secondary text-center max-w-[610px]">
              {SUBTEXT_SUGGESTION}
            </p>
          </section>

          {/* Primary Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <Button to="/ringkasan" variant="primary" className="px-8 h-12">
              Ringkasan
            </Button>

            <TextLink to="/latihan">
              Ulangi
            </TextLink>
          </div>

        </div>
      </div>
    </AppLayout>
  );
};

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useSession } from '../store/session';
import { hitungPatokanUpah } from '../lib/upah';

/* ─────────────────────────── Static content ─────────────────────────── */
const DEMO_TAWARAN = {
  gaji_bulanan: 2800000,
  jenis_pekerjaan: 'penuh_waktu' as const,
  skala_usaha: 'menengah_besar' as const,
  masa_kerja_kurang_1_tahun: true,
};

const ATTENTION_ITEMS = [
  {
    num: '01',
    title: 'Verifikasi perusahaan.',
    desc: 'Cek pendaftaran entitas badan hukum di AHU Online Kemenkumham serta alamat fisik kantor operasional resmi.',
  },
  {
    num: '02',
    title: 'Jangan bayar biaya awal.',
    desc: 'Sesuai regulasi ketenagakerjaan, rekruter dilarang membebankan biaya seragam, tes kesehatan, atau deposit jaminan.',
  },
  {
    num: '03',
    title: 'Tanyakan tunjangan.',
    desc: 'Pastikan komponen gaji pokok memenuhi acuan minimum sebelum memperhitungkan tunjangan tidak tetap dan BPJS.',
  },
];

/* ─────────────────────────── Print stylesheet ─────────────────────────── */
const PRINT_CSS = `
@page {
  size: A4 portrait;
  margin: 14mm 16mm;
}

@media print {
  /* ── Force color rendering ── */
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

  /* ── Hide app shell: sticky header nav, footer, state bar, action row ── */
  header,
  footer,
  .no-print { display: none !important; }

  /* ── Reset layout wrappers ── */
  html, body {
    background: #fff !important;
    margin: 0 !important;
    padding: 0 !important;
    font-size: 12px;
  }

  /* ── Flatten the AppLayout flex wrappers ── */
  #root > div { display: block !important; min-height: unset !important; }
  main { display: block !important; }

  /* The main content wrapper — remove screen padding/centering */
  .rks-body {
    padding: 0 !important;
    max-width: 100% !important;
    width: 100% !important;
  }

  .rks-inner {
    max-width: 100% !important;
    width: 100% !important;
  }

  /* ── Show print-only header ── */
  .rks-print-header {
    display: flex !important;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 8px;
    margin-bottom: 14px;
    border-bottom: 1px solid #E0E0E5;
  }

  /* ── Headline: compact for print ── */
  .rks-headline {
    padding-top: 6px !important;
    padding-bottom: 10px !important;
  }
  .rks-headline-label { font-size: 9px !important; margin-bottom: 3px !important; }
  .rks-headline-h1 { font-size: 28px !important; line-height: 32px !important; margin-bottom: 3px !important; }
  .rks-headline-sub { font-size: 12px !important; line-height: 17px !important; }

  /* ── Force 3-col panels side by side ── */
  .rks-panels {
    display: grid !important;
    grid-template-columns: 1fr 1fr 1fr !important;
    gap: 8px !important;
    width: 100% !important;
    max-width: 100% !important;
    padding: 0 !important;
    margin: 0 0 12px 0 !important;
    flex-direction: unset !important;
  }

  .rks-panel {
    break-inside: avoid !important;
    border-radius: 6px !important;
    padding: 12px 14px !important;
    min-height: auto !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: space-between !important;
  }

  .rks-panel-header { margin-bottom: 6px !important; }

  .rks-panel-metric {
    font-size: 24px !important;
    line-height: 28px !important;
    letter-spacing: -0.6px !important;
  }

  .rks-panel-fraction {
    font-size: 16px !important;
    line-height: 22px !important;
  }

  .rks-panel-dot {
    width: 7px !important;
    height: 7px !important;
    min-width: 7px !important;
    min-height: 7px !important;
  }

  .rks-panel-divider {
    margin-top: 8px !important;
    padding-top: 7px !important;
  }

  .rks-panel-desc { font-size: 10px !important; line-height: 14px !important; }

  /* ── Attention section: full width, compact ── */
  .rks-attention {
    max-width: 100% !important;
    width: 100% !important;
    margin: 0 !important;
    margin-bottom: 0 !important;
  }

  .rks-attention-label {
    font-size: 9px !important;
    margin-bottom: 5px !important;
  }

  .rks-attention-card {
    border-radius: 4px !important;
    padding: 0 12px !important;
  }

  .rks-attention-item {
    padding-top: 8px !important;
    padding-bottom: 8px !important;
    gap: 10px !important;
  }

  .rks-attention-num {
    font-size: 9px !important;
    margin-top: 2px !important;
  }

  .rks-attention-title {
    font-size: 12px !important;
    line-height: 16px !important;
    margin-bottom: 2px !important;
  }

  .rks-attention-desc {
    font-size: 10px !important;
    line-height: 14px !important;
  }

  /* ── Page break ── */
  .rks-no-break { break-inside: avoid !important; }
}
`;

/* ─────────────────────────── Component ─────────────────────────── */
export const Ringkasan: React.FC = () => {
  const navigate = useNavigate();
  const { mode, lowongan, tawaran, evaluasi, loadDemoData, resetSession } = useSession();

  useEffect(() => {
    if (!lowongan || !tawaran || !evaluasi) {
      loadDemoData();
    }
  }, [lowongan, tawaran, evaluasi, loadDemoData]);

  /* ── Lowongan ── */
  const findings = lowongan?.temuan ?? [];
  const hasTinggi = findings.some((t) => t.bobot === 'tinggi');
  const hasSedang = findings.some((t) => t.bobot === 'sedang');
  const lowonganLevel = hasTinggi ? 'Tinggi' : hasSedang ? 'Sedang' : 'Aman';
  const lowonganLevelColor =
    lowonganLevel === 'Tinggi' ? 'text-danger' : lowonganLevel === 'Sedang' ? 'text-warning' : 'text-success';
  const lowonganDotColor =
    lowonganLevel === 'Tinggi' ? 'bg-danger' : lowonganLevel === 'Sedang' ? 'bg-warning' : 'bg-success';
  const temuanCount = findings.length;
  const lowonganDesc = findings.length > 0 ? 'Perlu verifikasi legalitas & kontak' : 'Tidak ada temuan berisiko.';

  /* ── Tawaran ── */
  const activeTawaran = tawaran ?? DEMO_TAWARAN;
  const calc = hitungPatokanUpah({
    gajiBulanan: activeTawaran.gaji_bulanan,
    jenisPekerjaan: activeTawaran.jenis_pekerjaan,
    skalaUsaha: activeTawaran.skala_usaha,
    masaKerjaKurang1Tahun: activeTawaran.masa_kerja_kurang_1_tahun,
  });
  const selisih = calc.selisih;
  const formatSelisih = (diff: number) => {
    if (diff < 0) return `−Rp${Math.abs(diff).toLocaleString('id-ID')}`;
    if (diff > 0) return `+Rp${diff.toLocaleString('id-ID')}`;
    return 'Rp0';
  };
  const tawaranColor =
    calc.posisi === 'di_bawah' ? 'text-warning' : calc.posisi === 'di_atas' ? 'text-success' : 'text-text';

  /* ── Evaluasi ── */
  const activeEvaluasi = evaluasi ?? { total_skor: 12, maksimal_skor: 15 };

  const handleMulaiBaru = () => { resetSession(); navigate('/'); };
  const handleCetak = () => window.print();

  const printDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <AppLayout isDemo={mode === 'contoh'}>
      <style>{PRINT_CSS}</style>

      {/* ═══════════════════════════
          PRINT-ONLY HEADER
      ═══════════════════════════ */}
      <div className="rks-print-header hidden" aria-hidden="true">
        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 14, color: '#1A1C1D', letterSpacing: '-0.3px' }}>
          SebelumTeken
        </span>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, color: '#5F5E60' }}>
          Ringkasan analisis · {printDate}
        </span>
      </div>

      {/* ═══════════════════════════
          STATE BAR (screen only)
      ═══════════════════════════ */}
      <div className="no-print w-full border-b border-divider/30">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-10 h-10 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" aria-hidden="true" />
            <span className="font-semibold text-[11px] leading-4 tracking-[0.6px] uppercase text-nav select-none">
              Data contoh
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3 select-none">
            <span className="font-semibold text-[11px] leading-4 tracking-[0.48px] text-secondary">
              Lowongan · Tawaran · Latihan
            </span>
            <span className="text-secondary/40 text-sm" aria-hidden="true">/</span>
            <span className="font-semibold text-[11px] leading-4 tracking-[0.48px] text-secondary">
              Semua selesai
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════
          MAIN CONTENT
      ═══════════════════════════ */}
      <div className="rks-body w-full flex-1 flex flex-col items-center px-4 sm:px-10 pb-20">
        <div className="rks-inner w-full max-w-[960px]">

          {/* ── Headline ── */}
          <section className="rks-headline flex flex-col items-center text-center pt-10 pb-8">
            <span className="rks-headline-label font-semibold text-[11px] leading-4 tracking-[0.96px] uppercase text-nav mb-2 select-none">
              RINGKASAN
            </span>
            <h1 className="rks-headline-h1 font-semibold text-4xl sm:text-[48px] leading-tight sm:leading-[52px] tracking-[-1.2px] text-text mb-3">
              Ringkasanmu.
            </h1>
            <p className="rks-headline-sub font-normal text-[17px] leading-[26px] tracking-[-0.085px] text-secondary max-w-[560px]">
              Ringkasan analisis tiga tahap: lowongan, tawaran, dan latihan negosiasi.
            </p>
          </section>

          {/* ── 3 Metric Panels ── */}
          <section
            aria-label="Hasil analisis"
            className="rks-panels flex flex-col md:flex-row gap-4 mb-10"
          >
            {/* Panel 1 – Lowongan */}
            <article className="rks-panel rks-no-break flex-1 flex flex-col justify-between bg-surface rounded-[24px] sm:rounded-[28px] p-6 sm:p-8 md:min-h-[200px]">
              <div>
                <div className="rks-panel-header flex items-baseline justify-between mb-4">
                  <span className="font-semibold text-[15px] leading-5 tracking-[-0.075px] text-text">
                    Lowongan
                  </span>
                  <span className="font-semibold text-[11px] leading-4 tracking-[0.48px] uppercase text-secondary">
                    {temuanCount} temuan
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rks-panel-dot w-2.5 h-2.5 rounded-full shrink-0 ${lowonganDotColor}`} aria-hidden="true" />
                  <span className={`rks-panel-metric font-semibold text-[42px] leading-[48px] tracking-[-1px] tabular-nums ${lowonganLevelColor}`}>
                    {lowonganLevel}
                  </span>
                </div>
              </div>
              <div className="rks-panel-divider border-t border-divider/30 pt-3 mt-5">
                <p className="rks-panel-desc font-normal text-[13px] leading-5 text-secondary">
                  {lowonganDesc}
                </p>
              </div>
            </article>

            {/* Panel 2 – Tawaran */}
            <article className="rks-panel rks-no-break flex-1 flex flex-col justify-between bg-surface rounded-[24px] sm:rounded-[28px] p-6 sm:p-8 md:min-h-[200px]">
              <div>
                <div className="rks-panel-header flex items-baseline justify-between mb-4">
                  <span className="font-semibold text-[15px] leading-5 tracking-[-0.075px] text-text">
                    Tawaran
                  </span>
                  <span className="font-semibold text-[11px] leading-4 tracking-[0.48px] uppercase text-secondary">
                    {calc.labelPosisi}
                  </span>
                </div>
                <span className={`rks-panel-metric font-semibold text-[42px] leading-[48px] tracking-[-1px] tabular-nums ${tawaranColor}`}>
                  {formatSelisih(selisih)}
                </span>
              </div>
              <div className="rks-panel-divider border-t border-divider/30 pt-3 mt-5">
                <p className="rks-panel-desc font-normal text-[13px] leading-5 text-secondary">
                  Di bawah standar wilayah 2026
                </p>
              </div>
            </article>

            {/* Panel 3 – Latihan */}
            <article className="rks-panel rks-no-break flex-1 flex flex-col justify-between bg-surface rounded-[24px] sm:rounded-[28px] p-6 sm:p-8 md:min-h-[200px]">
              <div>
                <div className="rks-panel-header flex items-baseline justify-between mb-4">
                  <span className="font-semibold text-[15px] leading-5 tracking-[-0.075px] text-text">
                    Latihan
                  </span>
                  <span className="font-semibold text-[11px] leading-4 tracking-[0.48px] uppercase text-secondary">
                    Simulasi
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rks-panel-dot w-2.5 h-2.5 rounded-full shrink-0 bg-text" aria-hidden="true" />
                  <span className="inline-flex items-baseline">
                    <span className="rks-panel-metric font-semibold text-[42px] leading-[48px] tracking-[-1px] text-text tabular-nums">
                      {activeEvaluasi.total_skor}
                    </span>
                    <span className="rks-panel-fraction font-normal text-[26px] leading-8 tracking-[-0.4px] text-secondary ml-0.5">
                      /{activeEvaluasi.maksimal_skor}
                    </span>
                  </span>
                </div>
              </div>
              <div className="rks-panel-divider border-t border-divider/30 pt-3 mt-5">
                <p className="rks-panel-desc font-normal text-[13px] leading-5 text-secondary">
                  Kejelasan, alasan, kesopanan
                </p>
              </div>
            </article>
          </section>

          {/* ── Attention Section ── */}
          <section
            aria-labelledby="perhatian-heading"
            className="rks-attention w-full max-w-[640px] mx-auto mb-10"
          >
            <span
              id="perhatian-heading"
              className="rks-attention-label block font-semibold text-[11px] leading-4 tracking-[0.72px] uppercase text-secondary mb-3 select-none"
            >
              HAL PERLU DIPERHATIKAN
            </span>

            <div className="rks-attention-card rks-no-break bg-surface rounded-2xl px-4 sm:px-6 py-2">
              <ul className="list-none m-0 p-0">
                {ATTENTION_ITEMS.map((item, idx) => (
                  <li
                    key={item.num}
                    className={`rks-attention-item flex items-start gap-4 py-4 ${
                      idx < ATTENTION_ITEMS.length - 1 ? 'border-b border-divider/30' : ''
                    }`}
                  >
                    <span className="rks-attention-num font-semibold text-[11px] leading-4 tracking-[0.48px] text-secondary mt-1 shrink-0 w-5 select-none">
                      {item.num}
                    </span>
                    <div>
                      <p className="rks-attention-title font-medium text-[15px] leading-[22px] tracking-[-0.075px] text-text mb-0.5">
                        {item.title}
                      </p>
                      <p className="rks-attention-desc font-normal text-[13px] leading-5 text-secondary">
                        {item.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ── Actions (screen only) ── */}
          <div className="no-print w-full max-w-[640px] mx-auto flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={handleMulaiBaru}
              className="inline-flex items-center gap-1 font-medium text-[17px] leading-[22px] tracking-[-0.085px] text-accent-strong hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
            >
              Mulai baru
              <span className="text-[18px] leading-none" aria-hidden="true">›</span>
            </button>

            <button
              type="button"
              onClick={handleCetak}
              className="inline-flex items-center gap-2 h-12 px-7 bg-accent-strong text-background font-medium text-[17px] leading-[22px] tracking-[-0.085px] rounded-full hover:opacity-90 active:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
              aria-label="Cetak ringkasan"
            >
              <svg width="16" height="14" viewBox="0 0 16 14" fill="none" aria-hidden="true">
                <path d="M3.5 3.5V1.25A.25.25 0 013.75 1h8.5a.25.25 0 01.25.25V3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                <rect x="1" y="3.5" width="14" height="6.5" rx="1.25" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M3.5 7.5h9M3.5 10h9v2.75a.25.25 0 01-.25.25H3.75a.25.25 0 01-.25-.25V10z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              Cetak
            </button>
          </div>

        </div>
      </div>
    </AppLayout>
  );
};

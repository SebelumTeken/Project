import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { Button } from '../components/Button';
import { TextLink } from '../components/TextLink';
import { Panel } from '../components/Panel';

/* ───────────────────────── Data ilustrasi (data contoh) ───────────────────────── */

const LANGKAH_RINGKAS = [
  { num: '01', title: 'Cek lowongan', desc: 'Identifikasi klausul janggal sejak awal.' },
  { num: '02', title: 'Cek tawaran', desc: 'Bandingkan standar gaji dan benefit.' },
  { num: '03', title: 'Latihan', desc: 'Simulasi negosiasi sebelum tanda tangan.' },
];

const LANGKAH_DETAIL = [
  { num: '01', title: 'Cek lowongan', desc: 'Unggah poster dan periksa bagian yang perlu ditinjau.' },
  { num: '02', title: 'Cek tawaran', desc: 'Bandingkan gaji dengan patokan UMP.' },
  { num: '03', title: 'Latihan negosiasi', desc: 'Latih jawaban sebelum berbicara dengan HRD.' },
];

const MANFAAT = [
  'Kenali informasi lowongan yang perlu diperiksa.',
  'Pahami posisi tawaran gajimu secara objektif.',
  'Persiapkan percakapan sebelum negosiasi HRD.',
];

const HASIL = [
  {
    label: 'TINGKAT PERHATIAN',
    value: 'Tinggi',
    color: 'text-danger',
    desc: 'Perlu verifikasi legalitas & kontak',
  },
  {
    label: 'POSISI TERHADAP UMP',
    value: '−Rp382.955',
    color: 'text-text',
    desc: 'Di bawah standar wilayah 2026',
  },
  {
    label: 'SKOR NEGOSIASI',
    value: '12/15',
    color: 'text-accent',
    desc: 'Kejelasan, alasan, kesopanan',
  },
];

/* ───────────────────────── Kartu pratinjau ───────────────────────── */

const cardBase =
  'w-full bg-background rounded-2xl border border-divider/50 shadow-[0_2px_12px_rgba(0,0,0,0.04)]';

const LowonganCard: React.FC<{ compact?: boolean }> = ({ compact }) => (
  <div className={`${cardBase} ${compact ? 'p-4' : 'p-5 sm:p-6'} flex flex-col`}>
    <div className="flex items-start justify-between gap-3">
      <p className={`font-semibold text-text ${compact ? 'text-[12px]' : 'text-[14px]'}`}>
        {compact ? 'Staf Operasional' : 'Staff Administrasi & Operasional'}
      </p>
      <span className="text-[11px] text-secondary shrink-0">
        {compact ? 'PT Mitra Raya' : 'PT Mitra Sejahtera'}
      </span>
    </div>

    <ul className={`flex flex-col gap-2 ${compact ? 'mt-4' : 'mt-5'}`}>
      {[
        { text: 'Biaya seragam Rp150.000', tag: 'DIPERIKSA' },
        { text: 'Daftar via WhatsApp', tag: 'PERHATIAN' },
      ].map((item) => (
        <li key={item.text} className="flex items-center justify-between gap-3">
          <span className={`flex items-center gap-2 text-text ${compact ? 'text-[11px]' : 'text-[13px]'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-text shrink-0" aria-hidden="true" />
            {item.text}
          </span>
          <span className="text-[10px] font-semibold tracking-[0.6px] text-secondary shrink-0">
            {item.tag}
          </span>
        </li>
      ))}
    </ul>

    <div className={`border-t border-divider/40 ${compact ? 'mt-4 pt-3' : 'mt-5 pt-4'}`}>
      <p className="text-[10px] font-semibold tracking-[0.6px] text-secondary mb-2">
        PERLU DIPERIKSA
      </p>
      <div className={`flex flex-col gap-1.5 ${compact ? 'text-[11px]' : 'text-[12px]'}`}>
        <div className="flex justify-between gap-3">
          <span className="text-secondary">Biaya di awal</span>
          <span className="font-medium text-text">Risiko tinggi</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-secondary">Lewat pesan pribadi</span>
          <span className="font-medium text-text">Kanal non-resmi</span>
        </div>
      </div>
    </div>

    <p className={`text-center text-[11px] text-secondary ${compact ? 'mt-5' : 'mt-6'}`}>
      Bukan bukti penipuan. Tetap verifikasi.
    </p>
  </div>
);

const TawaranCompactCard: React.FC = () => (
  <div className={`${cardBase} p-4 flex flex-col`}>
    <div className="flex items-start justify-between gap-3">
      <p className="font-semibold text-[12px] text-text">Patokan UMP Wilayah</p>
      <span className="text-[10px] font-semibold tracking-[0.6px] text-secondary shrink-0">
        DI BAWAH
      </span>
    </div>
    <p className="mt-5 font-semibold text-[26px] leading-8 tracking-[-0.6px] text-danger tabular-nums">
      −Rp382.955
    </p>
    <p className="mt-1 text-[11px] text-secondary tabular-nums">Rp2.800.000 vs Rp3.182.955</p>
    <div className="mt-4 h-1.5 w-full bg-divider/60 rounded-full overflow-hidden">
      <div className="h-full bg-warning rounded-full" style={{ width: '87.9%' }} />
    </div>
    <p className="mt-auto pt-8 text-[11px] text-secondary">87,9% dari standar wilayah</p>
  </div>
);

const TawaranCard: React.FC = () => (
  <div className="w-full bg-surface rounded-[24px] border border-divider/40 p-5 sm:p-6 flex flex-col">
    <div className="flex items-start justify-between gap-3">
      <span className="text-[10px] font-semibold tracking-[0.6px] text-secondary">
        POSISI TAWARAN
      </span>
      <span className="text-[11px] text-secondary">Di bawah patokan</span>
    </div>
    <p className="mt-4 font-semibold text-[34px] sm:text-[40px] leading-[44px] tracking-[-1px] text-danger tabular-nums">
      −Rp382.955
    </p>
    <div className="mt-4 flex flex-col gap-2 text-[13px]">
      <div className="flex justify-between gap-3">
        <span className="text-secondary">Tawaran</span>
        <span className="font-semibold text-text tabular-nums">Rp2.800.000</span>
      </div>
      <div className="flex justify-between gap-3">
        <span className="text-secondary">UMP</span>
        <span className="font-semibold text-text tabular-nums">Rp3.182.955</span>
      </div>
    </div>
    <div className="mt-6">
      <div className="flex justify-between text-[11px] text-secondary mb-1.5">
        <span>87,9% dari standar wilayah</span>
        <span>100%</span>
      </div>
      <div className="h-2 w-full bg-divider/60 rounded-full overflow-hidden">
        <div className="h-full bg-warning rounded-full" style={{ width: '87.9%' }} />
      </div>
    </div>
    <p className="mt-6 text-center text-[11px] text-secondary">Patokan awal. Ada pengecualian.</p>
  </div>
);

const ChatCompactCard: React.FC = () => (
  <div className={`${cardBase} p-4 flex flex-col`}>
    <div className="flex items-start justify-between gap-3">
      <p className="font-semibold text-[12px] text-text">Simulasi Respon</p>
      <span className="text-[11px] font-medium text-accent shrink-0">Skor 12/15</span>
    </div>
    <div className="mt-4 flex flex-col gap-2">
      <p className="self-start max-w-[90%] bg-surface rounded-2xl rounded-bl-[4px] px-3 py-2 text-[11px] text-text">
        “Tawaran kami Rp2.800.000.”
      </p>
      <p className="self-end max-w-[85%] bg-accent rounded-2xl rounded-br-[4px] px-3 py-2 text-[11px] text-background">
        “Apakah ada ruang untuk peninjauan?”
      </p>
    </div>
    <p className="mt-auto pt-8 text-[11px] text-secondary">Latih argumen sopan &amp; jelas</p>
  </div>
);

const ChatCard: React.FC = () => (
  <div className="w-full bg-surface rounded-[24px] border border-divider/40 p-4 sm:p-5 flex flex-col gap-3">
    <p className="self-start max-w-[85%] bg-background rounded-2xl rounded-bl-[4px] px-4 py-2.5 text-[13px] text-text border border-divider/40">
      Kami menawarkan Rp2.800.000. Bagaimana?
    </p>
    <p className="self-end max-w-[85%] bg-accent rounded-2xl rounded-br-[4px] px-4 py-2.5 text-[13px] text-background">
      Apakah masih bisa dibicarakan?
    </p>
    <div className="grid grid-cols-3 gap-1 bg-background rounded-full border border-divider/40 px-2 py-2 text-[11px] sm:text-[12px] text-center">
      <span>
        Kejelasan <span className="text-accent font-medium">4/5</span>
      </span>
      <span>
        Alasan <span className="text-accent font-medium">3/5</span>
      </span>
      <span>
        Kesopanan <span className="text-accent font-medium">5/5</span>
      </span>
    </div>
    <div className="bg-background rounded-2xl border border-divider/40 px-4 py-3">
      <p className="text-[10px] font-semibold tracking-[0.6px] text-secondary">COBA KALIMAT INI</p>
      <p className="mt-1 text-[12px] italic text-text">
        “Sesuai tanggung jawabnya, apakah gaji bisa ditinjau?”
      </p>
    </div>
  </div>
);

/* ───────────────────────── Elemen judul bagian ───────────────────────── */

const SectionTitle: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="flex flex-col items-center text-center">
    <h2 className="font-semibold text-[32px] sm:text-[44px] leading-tight sm:leading-[52px] tracking-[-1px] text-text">
      {title}
    </h2>
    {subtitle && (
      <p className="mt-2 text-[17px] sm:text-[19px] leading-7 text-secondary">{subtitle}</p>
    )}
  </div>
);

const FeatureText: React.FC<{ title: string; desc: string }> = ({ title, desc }) => (
  <div className="flex flex-col">
    <h3 className="font-semibold text-[26px] sm:text-[32px] leading-tight tracking-[-0.6px] text-text">
      {title}
    </h3>
    <p className="mt-3 text-[16px] sm:text-[17px] leading-7 text-secondary max-w-[420px]">{desc}</p>
  </div>
);

/* ───────────────────────── Halaman ───────────────────────── */

export const Beranda: React.FC = () => {
  const location = useLocation();

  // Scroll ke bagian (#tentang, #cara-kerja, #fitur) saat hash berubah
  useEffect(() => {
    if (!location.hash) return;
    const el = document.getElementById(location.hash.slice(1));
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [location.hash]);

  const scrollToCaraKerja = () => {
    document.getElementById('cara-kerja')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <AppLayout>
      <div className="w-full flex-1 flex flex-col items-center px-4 sm:px-6 md:px-10 lg:px-20 pb-16">
        <div className="w-full max-w-[1040px] flex flex-col">
          {/* ── Hero ── */}
          <section className="w-full flex flex-col items-center text-center pt-16 pb-12 sm:pt-24 sm:pb-20 md:pt-28 md:pb-24">
            <h1 className="max-w-[820px] font-semibold text-4xl sm:text-6xl md:text-[72px] leading-tight md:leading-[76px] tracking-[-1.8px] text-text">
              Periksa dulu. Baru teken.
            </h1>
            <p className="mt-6 max-w-[620px] text-[17px] sm:text-[19px] leading-7 tracking-[-0.095px] text-secondary">
              Cek lowongan, bandingkan gaji, dan latih negosiasimu.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <Button to="/lowongan">Mulai</Button>
              <TextLink onClick={scrollToCaraKerja}>Pelajari cara kerja</TextLink>
            </div>
          </section>

          {/* ── Ringkasan 3 langkah ── */}
          <section aria-label="Ringkasan langkah">
            <Panel radius="32" className="py-10 px-6 sm:py-16 sm:px-12 md:py-20 md:px-16">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16">
                {LANGKAH_RINGKAS.map((s) => (
                  <div key={s.num} className="flex flex-col items-start text-left">
                    <span className="font-semibold text-[40px] sm:text-[48px] leading-[44px] sm:leading-[52px] tracking-[-1.2px] text-text">
                      {s.num}
                    </span>
                    <h3 className="mt-2 font-semibold text-[24px] sm:text-[28px] leading-[30px] sm:leading-[34px] tracking-[-0.42px] text-text">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-[17px] leading-7 tracking-[-0.051px] text-secondary">
                      {s.desc}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>
          </section>

          {/* ── Tentang ── */}
          <section id="tentang" className="scroll-mt-20 pt-20 sm:pt-32 flex flex-col items-center">
            <SectionTitle
              title="Kenali SebelumTeken."
              subtitle="Persiapkan diri sebelum menerima tawaran kerja."
            />
            <p className="mt-6 max-w-[640px] text-center text-[16px] sm:text-[17px] leading-7 text-text">
              SebelumTeken adalah aplikasi web yang membantu pencari kerja memeriksa lowongan,
              membandingkan tawaran gaji, dan berlatih negosiasi sebelum menyetujui pekerjaan.
            </p>

            <ul className="mt-8 w-full max-w-[880px] grid grid-cols-1 sm:grid-cols-3 gap-3">
              {MANFAAT.map((m) => (
                <li
                  key={m}
                  className="flex items-start gap-2.5 bg-surface border border-divider/40 rounded-[20px] sm:rounded-full px-4 py-3 text-[13px] leading-5 text-text"
                >
                  <svg
                    className="w-4 h-4 mt-0.5 shrink-0 text-accent"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <circle cx="8" cy="8" r="6.5" />
                    <polyline points="5.25 8.25 7.25 10 10.75 6.25" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {m}
                </li>
              ))}
            </ul>

            <div className="mt-10 w-full bg-surface rounded-[24px] sm:rounded-[32px] border border-divider/40 p-4 sm:p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <LowonganCard compact />
                <TawaranCompactCard />
                <ChatCompactCard />
              </div>
            </div>
          </section>

          {/* ── Cara kerja ── */}
          <section id="cara-kerja" className="scroll-mt-20 pt-20 sm:pt-32">
            <SectionTitle
              title="Mulai dari tiga langkah."
              subtitle="Lebih siap sebelum menerima tawaran kerja."
            />
            <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
              {LANGKAH_DETAIL.map((s) => (
                <div key={s.num} className="flex flex-col border-t border-divider/50 pt-6 md:border-0 md:pt-0">
                  <span className="font-semibold text-[44px] sm:text-[56px] leading-none tracking-[-1.4px] text-text">
                    {s.num}
                  </span>
                  <h3 className="mt-4 font-semibold text-[20px] leading-7 text-text">{s.title}</h3>
                  <p className="mt-2 text-[16px] leading-7 text-secondary max-w-[300px]">{s.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Fitur ── */}
          <section
            id="fitur"
            aria-label="Fitur"
            className="scroll-mt-20 pt-20 sm:pt-32 flex flex-col gap-16 sm:gap-24"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
              <FeatureText
                title="Kenali tanda yang perlu diperiksa."
                desc="Unggah poster untuk meninjau informasi lowongan kerja."
              />
              <LowonganCard />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
              {/* Di HP teks tampil dulu, di desktop kartu di kiri */}
              <div className="md:order-2">
                <FeatureText
                  title="Ketahui posisi tawaranmu."
                  desc="Bandingkan gaji dengan patokan UMP Sumatera Barat."
                />
              </div>
              <div className="md:order-1">
                <TawaranCard />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
              <FeatureText
                title="Lebih siap bicara dengan HRD."
                desc="Berlatih menjawab tawaran melalui simulasi percakapan."
              />
              <ChatCard />
            </div>
          </section>

          {/* ── Hasil ── */}
          <section aria-label="Contoh hasil" className="pt-20 sm:pt-32">
            <Panel radius="32" className="px-4 py-12 sm:px-10 sm:py-16 md:px-12">
              <p className="text-center text-[11px] font-semibold tracking-[0.96px] text-secondary mb-2">
                DATA CONTOH
              </p>
              <SectionTitle
                title="Semua lebih terarah."
                subtitle="Tiga hasil untuk membantu mengambil keputusan."
              />
              <div className="mt-10 sm:mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
                {HASIL.map((h) => (
                  <div key={h.label} className={`${cardBase} p-5 sm:p-6`}>
                    <p className="text-[10px] font-semibold tracking-[0.72px] text-secondary">{h.label}</p>
                    <p
                      className={`mt-5 font-semibold text-[32px] sm:text-[34px] leading-10 tracking-[-0.8px] tabular-nums ${h.color}`}
                    >
                      {h.value}
                    </p>
                    <p className="mt-4 text-[12px] text-secondary">{h.desc}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </section>

          {/* ── CTA ── */}
          <section className="pt-20 sm:pt-32 pb-4 flex flex-col items-center text-center">
            <h2 className="font-semibold text-[32px] sm:text-[48px] leading-tight sm:leading-[56px] tracking-[-1.2px] text-text">
              Siap sebelum tanda tangan?
            </h2>
            <p className="mt-3 text-[17px] leading-7 text-secondary">
              Periksa lowongan, bandingkan gaji, dan latih negosiasimu.
            </p>
            <div className="mt-8">
              <Button to="/lowongan">Mulai</Button>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

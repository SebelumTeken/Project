import React from 'react';
import { Navigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { Button } from '../components/Button';
import { TextLink } from '../components/TextLink';
import { useSession } from '../store/session';
import {
  hitungPatokanUpah,
  LABEL_SATUAN,
  SUMBER_UMP_SUMBAR_2026,
  SUMBER_UMSP_SUMBAR_2026,
  UMSP_SUMBAR_2026,
} from '../lib/upah';
import { buatPertanyaanTawaran } from '../lib/pertanyaan';
import { buatRingkasanAturan } from '../lib/aturan';
import { bandingkanDenganRataRata, formatRupiahPasar, PERIODE_DATA_SEKTOR } from '../lib/upahSektor';

export const HasilTawaran: React.FC = () => {
  const { tawaran } = useSession();

  // Belum ada input tawaran: arahkan ke form, jangan tampilkan data contoh
  if (!tawaran) {
    return <Navigate to="/tawaran" replace />;
  }

  const activeTawaran = tawaran;

  const input = {
    gajiBulanan: activeTawaran.gaji_bulanan,
    jenisPekerjaan: activeTawaran.jenis_pekerjaan,
    skalaUsaha: activeTawaran.skala_usaha,
    masaKerjaKurang1Tahun: activeTawaran.masa_kerja_kurang_1_tahun,
    hariKerjaPerMinggu: activeTawaran.hari_kerja_per_minggu,
  };
  const calculation = hitungPatokanUpah(input);
  const pertanyaan = buatPertanyaanTawaran(input, calculation);
  const aturan = buatRingkasanAturan(input, calculation);
  const satuan = LABEL_SATUAN[calculation.satuan];
  const pasar = bandingkanDenganRataRata(
    activeTawaran.gaji_bulanan,
    activeTawaran.sektor_usaha,
    activeTawaran.jenis_pekerjaan
  );

  const LABEL_JENIS: Record<typeof input.jenisPekerjaan, string> = {
    penuh_waktu: 'Penuh waktu',
    paruh_waktu: 'Paruh waktu',
    magang: 'Magang',
    harian: 'Harian',
    tidak_tahu: 'Status belum diketahui',
  };
  const LABEL_SKALA: Record<typeof input.skalaUsaha, string> = {
    menengah_besar: 'Usaha menengah/besar',
    mikro_kecil: 'Usaha mikro/kecil',
    tidak_tahu: 'Skala belum diketahui',
  };
  const konteks = [
    activeTawaran.posisi?.trim() || null,
    LABEL_JENIS[input.jenisPekerjaan],
    input.jenisPekerjaan === 'harian' ? `${input.hariKerjaPerMinggu ?? 6} hari kerja/minggu` : null,
    LABEL_SKALA[input.skalaUsaha],
  ].filter((k): k is string => Boolean(k));

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

  // Persentase asli terhadap UMP (boleh di atas 100%)
  const persen = (activeTawaran.gaji_bulanan / calculation.nominalPatokan) * 100;
  const persenLabel = persen.toLocaleString('id-ID', { maximumFractionDigits: 1 });

  // Skala bar: sampai UMP, atau sampai nominal tawaran jika lebih besar
  const skalaMaks = Math.max(activeTawaran.gaji_bulanan, calculation.nominalPatokan);
  const lebarTawaran = (activeTawaran.gaji_bulanan / skalaMaks) * 100;
  const posisiUmp = (calculation.nominalPatokan / skalaMaks) * 100;

  return (
    <AppLayout stepText="2 dari 3">
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
              UMP Sumbar 2026
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
              {calculation.alasan ??
                `Dibandingkan dengan ${calculation.keteranganPatokan}: ${'Rp' + calculation.nominalPatokan.toLocaleString('id-ID')} ${satuan}.`}
            </p>

            {/* Ringkasan input dari halaman Cek Tawaran */}
            <ul className="mt-5 flex flex-wrap items-center justify-center gap-2" aria-label="Konteks tawaran">
              {konteks.map((k) => (
                <li
                  key={k}
                  className="px-3 py-1 bg-surface rounded-full text-[13px] leading-5 text-secondary"
                >
                  {k}
                </li>
              ))}
            </ul>
          </section>

          {/* Dual Balanced Analytic Panels (Side by Side Grid, 1040px max, 32px gap) */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 items-start mb-12 sm:mb-16">
            {/* Left Panel: Quantitative Difference & Benchmark Gauge */}
            <article className="w-full md:min-h-[640px] p-6 sm:p-10 bg-surface rounded-3xl flex flex-col justify-between">
              <div>
                <span className="font-semibold text-[12px] leading-4 tracking-[1.2px] uppercase text-secondary mb-2 block">
                  SELISIH NOMINAL
                </span>

                <div className="flex flex-wrap items-baseline">
                  <span
                    className={`font-semibold text-[34px] sm:text-[46px] leading-[44px] sm:leading-[52px] break-words tracking-[-1.2px] ${positionColorClass}`}
                  >
                    {formatDifference(calculation.selisih)}
                  </span>
                  <span className="ml-2 text-[14px] text-secondary">{satuan}</span>
                </div>

                <p className="mt-1 font-normal text-[14px] leading-5 text-secondary">
                  dari {calculation.keteranganPatokan}
                </p>
                <p className="mt-0.5 font-normal text-[12px] leading-4 text-secondary">
                  {SUMBER_UMP_SUMBAR_2026}
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
                      <span className="ml-1 text-[13px] font-normal text-secondary">{satuan}</span>
                    </span>
                  </div>

                  {/* Row 2: Patokan UMP */}
                  <div className="w-full min-h-11 py-2 px-4 bg-background rounded-2xl flex items-center justify-between gap-3">
                    <span className="font-normal text-[16px] leading-[25px] tracking-[-0.051px] text-secondary">
                      {calculation.wajibUmp ? 'Patokan UMP' : 'Pembanding UMP'}
                    </span>
                    <span className="font-semibold text-[17px] sm:text-[20px] leading-7 tracking-[-0.55px] text-text tabular-nums">
                      Rp{calculation.nominalPatokan.toLocaleString('id-ID')}
                      <span className="ml-1 text-[13px] font-normal text-secondary">{satuan}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Proportional Metric Bar */}
              <div className="pt-10">
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className={`font-medium text-[14px] leading-5 ${positionColorClass}`}>
                    Tawaran ({persenLabel}% dari patokan)
                  </span>
                  <span className="font-normal text-[14px] leading-5 text-secondary">
                    {calculation.wajibUmp ? 'Patokan UMP' : 'Pembanding UMP'}
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
                    style={{ width: `${lebarTawaran}%` }}
                  />
                  {/* Penanda posisi UMP jika tawaran melebihi UMP */}
                  {posisiUmp < 100 && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-text/70"
                      style={{ left: `${posisiUmp}%` }}
                      aria-hidden="true"
                    />
                  )}
                </div>

                <div className="mt-1 flex items-center justify-between text-xs text-secondary font-semibold tracking-[0.48px]">
                  <span>Rp0</span>
                  <span>Rp{skalaMaks.toLocaleString('id-ID')}</span>
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
                    {pertanyaan.length} PERTANYAAN
                  </span>
                </div>

                <p className="font-normal text-[17px] leading-[25px] tracking-[-0.051px] text-secondary mb-6">
                  Ajukan pertanyaan terstruktur berikut secara profesional kepada
                  perekrut sebelum menandatangani surat perjanjian:
                </p>

                {/* Pertanyaan disusun dari isi tawaran */}
                <div className="flex flex-col gap-4">
                  {pertanyaan.map((q, i) => (
                    <div
                      key={q.judul}
                      className="w-full p-4 bg-background rounded-2xl flex items-start gap-4"
                    >
                      <span className="font-semibold text-[12px] leading-4 tracking-[0.48px] text-warning mt-1 select-none">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="flex flex-col gap-1">
                        <h3 className="font-medium text-[18px] sm:text-[20px] leading-7 tracking-[-0.55px] text-text">
                          {q.judul}
                        </h3>
                        <p className="font-normal text-[14px] leading-5 text-secondary">
                          {q.penjelasan}
                        </p>
                      </div>
                    </div>
                  ))}
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

          {/* Gambaran pasar BPS: konteks, bukan patokan. Hanya untuk penuh waktu. */}
          {pasar && (
            <section aria-labelledby="pasar-heading" className="w-full max-w-[760px] mb-12 sm:mb-16">
              <h2
                id="pasar-heading"
                className="font-semibold text-[24px] sm:text-[28px] leading-[34px] tracking-[-0.7px] text-text mb-2"
              >
                Gambaran pasar (bukan patokan)
              </h2>
              <div className="bg-surface rounded-3xl px-5 sm:px-8 py-6 flex flex-col gap-2">
                <p className="font-medium text-[16px] leading-6 text-text">
                  Rata-rata nasional bidang {pasar.sektor.label}: {formatRupiahPasar(pasar.rataNasionalSektor)}
                </p>
                <p className="text-[14px] leading-5 text-secondary">
                  Tawaran kamu {pasar.persenDariRataNasional}% dari rata-rata itu.
                </p>
                <p className="text-[14px] leading-5 text-secondary">
                  Rata-rata semua bidang di Sumatera Barat: {formatRupiahPasar(pasar.rataSumbarSemuaSektor)}
                </p>
                {pasar.catatan.map((c) => (
                  <p key={c} className="text-[13px] leading-5 text-secondary">
                    {c}
                  </p>
                ))}
              </div>
              <p className="mt-3 px-1 text-[12px] leading-4 text-secondary">
                Sumber: BPS, Sakernas {PERIODE_DATA_SEKTOR}.
              </p>
            </section>
          )}

          {/* Aturan yang berlaku untuk kondisi tawaran ini */}
          <section aria-labelledby="aturan-heading" className="w-full max-w-[760px] mb-12 sm:mb-16">
            <h2
              id="aturan-heading"
              className="font-semibold text-[24px] sm:text-[28px] leading-[34px] tracking-[-0.7px] text-text mb-2"
            >
              Aturan yang berlaku
            </h2>
            <p className="text-[14px] leading-5 text-secondary mb-5">
              {calculation.wajibUmp
                ? 'UMP wajib berlaku untuk tawaran ini. Berikut standar gaji yang perlu kamu cek.'
                : 'UMP tidak wajib atau belum bisa dipastikan untuk tawaran ini. Berikut aturan yang relevan.'}
            </p>
            <ul className="bg-surface rounded-3xl px-5 sm:px-8 py-2">
              {aturan.map((a, i) => (
                <li
                  key={a.judul}
                  className={`py-4 flex items-start gap-4 ${
                    i < aturan.length - 1 ? 'border-b border-divider/40' : ''
                  }`}
                >
                  <span className="font-semibold text-[12px] leading-4 tracking-[0.48px] text-secondary mt-1 w-5 shrink-0 select-none">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p className="font-medium text-[16px] leading-6 text-text">{a.judul}</p>
                    <p className="mt-0.5 text-[14px] leading-5 text-secondary">{a.isi}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 px-1 text-[12px] leading-4 text-secondary">
              Ringkasan umum dari UU 6/2023, PP 35/2021, PP 36/2021, PP 7/2021, dan Permenaker 6/2020. Bukan nasihat hukum.
            </p>
          </section>

          {/* Lower Decision Action Area */}
          <section className="w-full flex flex-col items-center text-center">
            <p className="font-normal text-[14px] leading-5 text-secondary mb-4">
              Patokan awal. Ada pengecualian.
            </p>
            <p className="font-normal text-[12px] leading-4 text-secondary mb-6 max-w-[520px]">
              Dua sektor usaha tertentu memakai UMSP Rp
              {UMSP_SUMBAR_2026.toLocaleString('id-ID')} ({SUMBER_UMSP_SUMBAR_2026}).
            </p>

            <Button to="/latihan" className="!w-[130px] !min-w-[130px] !px-0">
              Latihan
            </Button>

            <div className="mt-4">
              <TextLink to="/tawaran" state={{ ubah: true }} className="text-sm font-normal text-accent-strong">
                Ubah nominal atau konteks tawaran
              </TextLink>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

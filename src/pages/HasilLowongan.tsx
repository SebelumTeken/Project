import React, { useEffect, useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { Button } from '../components/Button';
import { TextLink } from '../components/TextLink';
import { useSession } from '../store/session';
import { TemuanItem } from '../types';

export const HasilLowongan: React.FC = () => {
  const { lowongan, loadDemoData } = useSession();
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  useEffect(() => {
    // Ensure data exists for UI phase
    if (!lowongan) {
      loadDemoData();
    }
  }, [lowongan, loadDemoData]);

  const activeLowongan = lowongan ?? {
    teks_terbaca:
      'Dicari Admin Toko Online. Gaji Rp8.000.000. Biaya seragam Rp150.000. Daftar via WhatsApp.',
    nama_perusahaan: null,
    posisi: 'Admin Toko Online',
    lokasi: 'Padang',
    gaji_tertulis: 8000000,
    kontak: 'WhatsApp',
    tingkat_perhatian: 'tinggi' as const,
    ringkasan:
      'Lowongan meminta biaya di awal dan proses pendaftaran lewat pesan pribadi.',
    temuan: [
      {
        id: 't1',
        kode_tanda: 'biaya_di_awal',
        bobot: 'tinggi' as const,
        judul: 'Biaya di awal',
        kutipan: 'Biaya seragam Rp150.000',
        penjelasan: 'Jangan bayar sebelum perusahaan jelas.',
      },
      {
        id: 't2',
        kode_tanda: 'pesan_pribadi',
        bobot: 'sedang' as const,
        judul: 'Lewat pesan pribadi',
        kutipan: 'Daftar via WhatsApp',
        penjelasan: 'Cek kanal resmi perusahaan.',
      },
    ],
  };

  const findings = activeLowongan.temuan ?? [];

  // Level determination: any 'tinggi' = Tinggi, else any 'sedang' = Sedang, else 'Belum ada tanda bahaya'
  const hasTinggi = findings.some((t) => t.bobot === 'tinggi');
  const hasSedang = findings.some((t) => t.bobot === 'sedang');
  const level = hasTinggi
    ? 'Tinggi'
    : hasSedang
    ? 'Sedang'
    : 'Belum ada tanda bahaya';

  const levelColorClass =
    level === 'Tinggi'
      ? 'text-danger'
      : level === 'Sedang'
      ? 'text-warning'
      : 'text-success';

  const renderHighlightedText = (fullText: string, temuanList: TemuanItem[]) => {
    if (!temuanList || temuanList.length === 0) return fullText;

    type MatchRange = {
      start: number;
      end: number;
      bobot: 'tinggi' | 'sedang';
      text: string;
    };
    const matches: MatchRange[] = [];

    temuanList.forEach((item) => {
      if (!item.kutipan) return;
      const idx = fullText.toLowerCase().indexOf(item.kutipan.toLowerCase());
      if (idx !== -1) {
        matches.push({
          start: idx,
          end: idx + item.kutipan.length,
          bobot: item.bobot,
          text: fullText.substring(idx, idx + item.kutipan.length),
        });
      }
    });

    if (matches.length === 0) return fullText;

    matches.sort((a, b) => a.start - b.start);

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    matches.forEach((m, i) => {
      if (m.start > lastIndex) {
        parts.push(fullText.substring(lastIndex, m.start));
      }
      const underlineClass =
        m.bobot === 'tinggi'
          ? 'underline decoration-danger decoration-2 underline-offset-4'
          : 'underline decoration-warning decoration-2 underline-offset-4';

      parts.push(
        <span key={i} className={underlineClass}>
          {m.text}
        </span>
      );
      lastIndex = m.end;
    });

    if (lastIndex < fullText.length) {
      parts.push(fullText.substring(lastIndex));
    }

    return parts;
  };

  return (
    <AppLayout stepText="1 dari 3" isDemo>
      {/* Sub-Header Step Bar */}
      <div className="w-full bg-background border-b border-divider/20">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-10 h-13 py-4 flex items-center justify-between text-sm">
          <span className="font-normal text-[14px] leading-5 tracking-[-0.35px] text-text select-none">
            Hasil Lowongan
          </span>
          <span className="font-normal text-[14px] leading-5 text-secondary select-none">
            1 dari 3
          </span>
          <span className="font-normal text-[14px] leading-5 text-secondary select-none">
            Data contoh
          </span>
        </div>
      </div>

      {/* Main Analysis Canvas (1120px container) */}
      <div className="w-full flex-1 flex flex-col items-center px-4 sm:px-10 pb-24">
        <div className="w-full max-w-[1040px] flex flex-col items-center">
          {/* Centered Attention Level Section */}
          <section className="w-full text-center pt-16 pb-20 flex flex-col items-center gap-1">
            <span className="font-normal text-[14px] leading-5 tracking-[-0.35px] text-secondary">
              Tingkat perhatian
            </span>

            <h1
              className={`font-semibold text-5xl sm:text-7xl leading-none tracking-[-1.8px] ${levelColorClass}`}
            >
              {level}
            </h1>

            <p className="mt-3 font-normal text-[17px] leading-[25px] tracking-[-0.051px] text-secondary">
              {findings.length > 0
                ? `${findings.length} bagian perlu diperiksa.`
                : 'Tetap cek kanal resmi perusahaan.'}
            </p>
          </section>

          {/* Comparative Panels (Side by Side Grid, 1040px max, 32px gap) */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Left Panel: Teks Poster */}
            <article className="w-full min-h-[346px] p-8 sm:p-10 bg-surface rounded-[32px] flex flex-col justify-between">
              <div>
                <h2 className="font-semibold text-[12px] leading-4 tracking-[0.6px] uppercase text-secondary mb-6">
                  TEKS POSTER
                </h2>
                <p className="font-semibold text-[20px] sm:text-[22px] leading-[34px] sm:leading-[36px] tracking-[-0.22px] text-text">
                  {renderHighlightedText(activeLowongan.teks_terbaca, findings)}
                </p>
              </div>

              <div className="pt-10 border-t border-divider/30 mt-6">
                <p className="font-normal text-[14px] leading-5 text-secondary">
                  Dokumen masukan: Poster_Loker_Admin.jpg
                </p>
              </div>
            </article>

            {/* Right Panel: Perlu Diperiksa */}
            <article className="w-full min-h-[346px] p-8 sm:p-10 bg-surface rounded-[32px] flex flex-col justify-between">
              <div>
                <h2 className="font-semibold text-[12px] leading-4 tracking-[0.6px] uppercase text-secondary mb-6">
                  PERLU DIPERIKSA
                </h2>

                {findings.length > 0 ? (
                  <div className="flex flex-col gap-6">
                    {findings.map((item) => (
                      <div key={item.id} className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              item.bobot === 'tinggi'
                                ? 'bg-danger'
                                : 'bg-warning'
                            }`}
                            aria-hidden="true"
                          />
                          <h3
                            className={`font-normal text-[19px] leading-7 tracking-[-0.095px] ${
                              item.bobot === 'tinggi'
                                ? 'text-danger'
                                : 'text-warning'
                            }`}
                          >
                            {item.judul}
                          </h3>
                        </div>
                        <p className="pl-3.5 font-normal text-[17px] leading-[25px] tracking-[-0.051px] text-secondary">
                          {item.penjelasan}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-normal text-[17px] leading-[25px] text-secondary">
                    Tidak ditemukan indikasi mencurigakan pada poster lowongan.
                  </p>
                )}
              </div>

              <div className="pt-10 border-t border-divider/30 mt-6">
                <p className="font-normal text-[14px] leading-5 text-secondary">
                  Kategori risiko: Biaya rekrutmen &amp; Jalur informal
                </p>
              </div>
            </article>
          </div>

          {/* Supplementary Advisory & Action Buttons */}
          <section className="w-full pt-12 flex flex-col items-center text-center">
            <p className="font-normal text-[14px] leading-5 text-secondary">
              Bukan kesimpulan akhir. Tetap verifikasi.
            </p>

            <div className="mt-10">
              <Button to="/tawaran" className="!w-[165px] !min-w-[165px] !px-0">
                Cek tawaran
              </Button>
            </div>

            {/* Sub-links row */}
            <div className="mt-12 flex items-center justify-center gap-6 text-sm">
              <TextLink
                to="/lowongan"
                showChevron={false}
                className="text-accent-strong hover:underline"
              >
                Unggah ulang
              </TextLink>
              <span className="text-divider select-none" aria-hidden="true">
                ·
              </span>
              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="text-secondary hover:text-text transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded-sm"
              >
                Pelajari tanda bahaya
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Simple Information Modal for "Pelajari tanda bahaya" */}
      {showGuideModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-text/40 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="w-full max-w-[540px] bg-background rounded-3xl p-8 shadow-xl">
            <h3 className="font-semibold text-2xl text-text mb-4">
              Tanda Bahaya Lowongan
            </h3>
            <p className="text-secondary text-sm leading-relaxed mb-6">
              Lowongan yang perlu diperiksa lebih teliti umumnya memungut biaya di
              awal (seragam, tes, akomodasi) atau mengalihkan proses verifikasi ke
              nomor pribadi sebelum kejelasan identitas perusahaan dipastikan.
            </p>
            <div className="flex justify-end">
              <Button onClick={() => setShowGuideModal(false)}>Tutup</Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

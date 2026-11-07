import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { Button } from '../components/Button';
import { useSession } from '../store/session';
import { hitungPatokanUpah } from '../lib/upah';

export const CekTawaran: React.FC = () => {
  const navigate = useNavigate();
  const { tawaran, setTawaran } = useSession();

  // Initial values from session or default demo
  const initialSalary = tawaran?.gaji_bulanan ?? 2800000;
  const [gajiInput, setGajiInput] = useState<string>(
    `Rp${initialSalary.toLocaleString('id-ID')}`
  );
  const [gajiRaw, setGajiRaw] = useState<number>(initialSalary);

  const [jenisPekerjaan, setJenisPekerjaan] = useState<
    'penuh_waktu' | 'paruh_waktu' | 'magang' | 'harian'
  >(
    tawaran?.jenis_pekerjaan && tawaran.jenis_pekerjaan !== 'tidak_tahu'
      ? (tawaran.jenis_pekerjaan as 'penuh_waktu' | 'paruh_waktu' | 'magang' | 'harian')
      : 'penuh_waktu'
  );

  const [skalaUsaha, setSkalaUsaha] = useState<
    'menengah_besar' | 'mikro_kecil' | 'tidak_tahu'
  >(tawaran?.skala_usaha ?? 'menengah_besar');

  const [masaKerjaKurang1Tahun, setMasaKerjaKurang1Tahun] = useState<boolean>(
    tawaran?.masa_kerja_kurang_1_tahun ?? true
  );

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    const num = rawDigits ? parseInt(rawDigits, 10) : 0;
    setGajiRaw(num);
    setGajiInput(num > 0 ? `Rp${num.toLocaleString('id-ID')}` : 'Rp');
  };

  const handleBandingkan = () => {
    const calculation = hitungPatokanUpah({
      gajiBulanan: gajiRaw,
      jenisPekerjaan,
      skalaUsaha,
      masaKerjaKurang1Tahun,
    });

    setTawaran({
      gaji_bulanan: gajiRaw,
      jenis_pekerjaan: jenisPekerjaan,
      skala_usaha: skalaUsaha,
      masa_kerja_kurang_1_tahun: masaKerjaKurang1Tahun,
      nominal_patokan: calculation.nominalPatokan,
      selisih_patokan: calculation.selisih,
      posisi_patokan: calculation.posisi,
      pertanyaan: [
        'Ini gaji masa percobaan?',
        'Ada tunjangan tetap?',
        'Kapan gaji ditinjau?',
      ],
    });

    navigate('/tawaran/hasil');
  };

  return (
    <AppLayout stepText="2 dari 3">
      {/* Sub-Header Step Bar */}
      <div className="w-full bg-background border-b border-divider/20">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-10 h-13 py-4 flex items-center justify-between text-sm">
          <span className="font-normal text-[14px] leading-5 tracking-[-0.35px] text-text select-none">
            Cek Tawaran
          </span>
          <span className="font-normal text-[14px] leading-5 text-secondary select-none">
            2 dari 3
          </span>
          <span className="font-normal text-[14px] leading-5 text-secondary select-none">
            Data contoh
          </span>
        </div>
      </div>

      {/* Main Form Section */}
      <div className="w-full flex-1 flex flex-col items-center justify-center px-4 sm:px-10 py-16 md:py-24">
        <div className="w-full max-w-[560px] flex flex-col items-center">
          {/* Heading 1 (Berapa tawarannya?) */}
          <h1 className="max-w-[440px] font-semibold text-5xl sm:text-6xl md:text-[72px] leading-tight md:leading-[76px] tracking-[-2.16px] text-text text-center mb-16">
            Berapa tawarannya?
          </h1>

          {/* Form Controls Column (560px) */}
          <div className="w-full flex flex-col gap-8">
            {/* 1. Large Currency Input on #F3F3F5 */}
            <div className="w-full flex flex-col gap-3">
              <div className="w-full bg-surface rounded-xl p-8 flex flex-col justify-center">
                <label
                  htmlFor="gaji-input"
                  className="font-semibold text-[12px] leading-4 tracking-[1.2px] uppercase text-secondary mb-2 select-none"
                >
                  NOMINAL TAWARAN
                </label>
                <div className="w-full flex items-center">
                  <input
                    id="gaji-input"
                    type="text"
                    inputMode="numeric"
                    value={gajiInput}
                    onChange={handleSalaryChange}
                    className="w-full bg-transparent font-semibold text-4xl sm:text-[48px] leading-[52px] tracking-[-1.2px] text-text focus:outline-none"
                    placeholder="Rp0"
                  />
                </div>
              </div>

              {/* Input Meta Row */}
              <div className="px-1 flex items-center justify-between text-sm">
                <span className="font-normal text-[14px] leading-5 text-secondary">
                  per bulan · Sumatera Barat
                </span>
                <span className="font-semibold text-[12px] leading-4 tracking-[0.6px] uppercase text-secondary select-none">
                  RUPIAH
                </span>
              </div>
            </div>

            {/* 2. Radiogroup: Jenis Pekerjaan */}
            <div className="w-full flex flex-col gap-2.5">
              <label className="font-semibold text-[14px] leading-5 text-text">
                Jenis
              </label>
              <div
                role="radiogroup"
                aria-label="Jenis Pekerjaan"
                className="w-full h-[52px] p-1.5 bg-surface rounded-full flex items-center gap-1"
              >
                {[
                  { id: 'penuh_waktu', label: 'Penuh waktu' },
                  { id: 'paruh_waktu', label: 'Paruh waktu' },
                  { id: 'magang', label: 'Magang' },
                  { id: 'harian', label: 'Harian' },
                ].map((item) => {
                  const isSelected = jenisPekerjaan === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() =>
                        setJenisPekerjaan(
                          item.id as 'penuh_waktu' | 'paruh_waktu' | 'magang' | 'harian'
                        )
                      }
                      className={`flex-1 h-10 rounded-full flex items-center justify-center transition-all text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        isSelected
                          ? 'bg-background text-text font-semibold shadow-sm'
                          : 'text-secondary hover:text-text'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Radiogroup: Skala Perusahaan */}
            <div className="w-full flex flex-col gap-2.5">
              <label className="font-semibold text-[14px] leading-5 text-text">
                Perusahaan
              </label>
              <div
                role="radiogroup"
                aria-label="Skala Perusahaan"
                className="w-full h-[52px] p-1.5 bg-surface rounded-full flex items-center gap-1"
              >
                {[
                  { id: 'menengah_besar', label: 'Menengah/besar' },
                  { id: 'mikro_kecil', label: 'Mikro/kecil' },
                  { id: 'tidak_tahu', label: 'Tidak tahu' },
                ].map((item) => {
                  const isSelected = skalaUsaha === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() =>
                        setSkalaUsaha(
                          item.id as 'menengah_besar' | 'mikro_kecil' | 'tidak_tahu'
                        )
                      }
                      className={`flex-1 h-10 rounded-full flex items-center justify-center transition-all text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        isSelected
                          ? 'bg-background text-text font-semibold shadow-sm'
                          : 'text-secondary hover:text-text'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Switch Row: Kurang dari 1 tahun */}
            <div className="w-full pt-2 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-normal text-[17px] leading-[25px] tracking-[-0.051px] text-text">
                  Kurang dari 1 tahun
                </span>
                <span className="font-normal text-[14px] leading-5 text-secondary">
                  Masa kerja pelamar di posisi ini
                </span>
              </div>

              {/* Toggle switch 56px x 32px */}
              <button
                type="button"
                role="switch"
                aria-checked={masaKerjaKurang1Tahun}
                onClick={() => setMasaKerjaKurang1Tahun(!masaKerjaKurang1Tahun)}
                className={`w-14 h-8 rounded-full p-1 transition-colors flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent ${
                  masaKerjaKurang1Tahun ? 'bg-accent' : 'bg-divider'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-background transition-transform duration-200 ease-in-out ${
                    masaKerjaKurang1Tahun ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 5. Action Button & Security note */}
            <div className="w-full pt-12 flex flex-col items-center gap-4">
              <Button
                onClick={handleBandingkan}
                disabled={gajiRaw <= 0}
                className="!w-[200px] !min-w-[200px] !px-0"
              >
                Bandingkan
              </Button>

              <div className="flex items-center gap-1.5 text-secondary text-sm">
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="7" width="10" height="7" rx="1.5" />
                  <path d="M5.5 7V4.5a2.5 2.5 0 0 1 5 0V7" />
                </svg>
                <span className="font-normal text-[14px] leading-5">
                  Data hanya dihitung secara lokal di browsermu.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

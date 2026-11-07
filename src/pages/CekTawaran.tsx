import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { Button } from '../components/Button';
import { useSession } from '../store/session';
import { hitungPatokanUpah, LABEL_SATUAN, satuanUntuk, SatuanUpah } from '../lib/upah';
import { buatPertanyaanTawaran } from '../lib/pertanyaan';

type Status = 'penuh_waktu' | 'paruh_waktu' | 'harian' | 'magang';
type Skala = 'menengah_besar' | 'mikro_kecil' | 'tidak_tahu';

const STATUS_OPTIONS: { id: Status; label: string; bantuan: string }[] = [
  { id: 'penuh_waktu', label: 'Penuh waktu', bantuan: 'Karyawan tetap atau kontrak, sekitar 40 jam per minggu. Isi gaji per bulan.' },
  { id: 'paruh_waktu', label: 'Paruh waktu', bantuan: 'Kurang dari 35 jam per minggu. Isi upah per jam.' },
  { id: 'harian', label: 'Harian', bantuan: 'Dibayar per hari kerja. Isi upah per hari.' },
  { id: 'magang', label: 'Magang', bantuan: 'Program magang. Isi uang saku per bulan.' },
];

const SKALA_OPTIONS: { id: Skala; label: string }[] = [
  { id: 'menengah_besar', label: 'Menengah/besar' },
  { id: 'mikro_kecil', label: 'Mikro/kecil' },
  { id: 'tidak_tahu', label: 'Tidak tahu' },
];

const BANTUAN_SKALA: Record<Skala, string> = {
  menengah_besar: 'Perusahaan menengah atau besar wajib membayar minimal UMP.',
  mikro_kecil:
    'Modal ≤ Rp5 miliar atau omzet ≤ Rp15 miliar per tahun, misalnya toko, warung, atau usaha rumahan. Upah boleh berdasarkan kesepakatan.',
  tidak_tahu: 'Tidak masalah. Hasilnya akan menjelaskan cara memastikannya. Label "UMKM" belum tentu berarti mikro atau kecil.',
};

const PLACEHOLDER: Record<SatuanUpah, string> = {
  bulan: 'Rp2.800.000',
  hari: 'Rp120.000',
  jam: 'Rp20.000',
};

/** Peringatan ringan jika angka tampak tidak cocok dengan satuannya. */
function peringatanNominal(satuan: SatuanUpah, nominal: number): string | null {
  if (nominal <= 0) return null;
  if (satuan === 'bulan' && nominal < 500_000) {
    return 'Angka ini terlihat kecil untuk gaji bulanan. Jika ini upah harian atau per jam, pilih status Harian atau Paruh waktu.';
  }
  if (satuan === 'hari' && nominal > 1_500_000) {
    return 'Angka ini terlihat besar untuk upah harian. Jika ini gaji bulanan, pilih status Penuh waktu.';
  }
  if (satuan === 'jam' && nominal > 300_000) {
    return 'Angka ini terlihat besar untuk upah per jam. Pastikan satuannya benar.';
  }
  return null;
}

const segBtn = (selected: boolean) =>
  `flex-1 h-10 px-1.5 rounded-full flex items-center justify-center text-center leading-tight transition-all text-[13px] sm:text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
    selected ? 'bg-background text-text font-semibold shadow-sm' : 'text-secondary hover:text-text'
  }`;

export const CekTawaran: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { lowongan, tawaran, setTawaran, setPesanLatihan, setEvaluasi } = useSession();

  // Isian lama hanya dipakai saat kembali dari hasil lewat "Ubah nominal atau konteks tawaran"
  const isUbah = (location.state as { ubah?: boolean } | null)?.ubah === true;
  const lama = isUbah ? tawaran : null;

  const [posisi, setPosisi] = useState<string>(lama?.posisi ?? lowongan?.posisi ?? '');
  const [status, setStatus] = useState<Status>(
    lama && lama.jenis_pekerjaan !== 'tidak_tahu' ? (lama.jenis_pekerjaan as Status) : 'penuh_waktu'
  );
  const [hariKerja, setHariKerja] = useState<5 | 6>(lama?.hari_kerja_per_minggu ?? 6);
  const [skala, setSkala] = useState<Skala>(lama?.skala_usaha ?? 'menengah_besar');

  const nominalAwal = lama?.gaji_bulanan ?? 0;
  const [nominal, setNominal] = useState<number>(nominalAwal);
  const [nominalInput, setNominalInput] = useState<string>(
    nominalAwal > 0 ? `Rp${nominalAwal.toLocaleString('id-ID')}` : ''
  );

  const satuan = satuanUntuk(status);
  const peringatan = peringatanNominal(satuan, nominal);
  const bantuanStatus = STATUS_OPTIONS.find((s) => s.id === status)?.bantuan;

  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    const num = digits ? parseInt(digits, 10) : 0;
    setNominal(num);
    setNominalInput(num > 0 ? `Rp${num.toLocaleString('id-ID')}` : '');
  };

  const handleStatusChange = (baru: Status) => {
    // Satuan berubah (bulan ↔ hari ↔ jam): kosongkan nominal agar tidak salah tafsir
    if (satuanUntuk(baru) !== satuanUntuk(status)) {
      setNominal(0);
      setNominalInput('');
    }
    setStatus(baru);
  };

  const handleBandingkan = () => {
    if (nominal <= 0) return;

    const input = {
      gajiBulanan: nominal,
      jenisPekerjaan: status,
      skalaUsaha: skala,
      masaKerjaKurang1Tahun: true, // tawaran kerja baru
      hariKerjaPerMinggu: hariKerja,
    };
    const calculation = hitungPatokanUpah(input);

    setTawaran({
      posisi: posisi.trim() || null,
      gaji_bulanan: nominal,
      jenis_pekerjaan: status,
      skala_usaha: skala,
      masa_kerja_kurang_1_tahun: true,
      hari_kerja_per_minggu: hariKerja,
      nominal_patokan: calculation.nominalPatokan,
      selisih_patokan: calculation.selisih,
      posisi_patokan: calculation.posisi,
      pertanyaan: buatPertanyaanTawaran(input, calculation).map((q) => q.judul),
    });

    // Tawaran berubah: latihan sebelumnya tidak relevan lagi
    setPesanLatihan([]);
    setEvaluasi(null);

    navigate('/tawaran/hasil');
  };

  return (
    <AppLayout stepText="2 dari 3">
      {/* Sub-Header Step Bar */}
      <div className="w-full bg-background border-b border-divider/20">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-10 py-4 flex items-center justify-between text-sm">
          <span className="font-normal text-[14px] leading-5 tracking-[-0.35px] text-text select-none">
            Cek Tawaran
          </span>
          <span className="font-normal text-[14px] leading-5 text-secondary select-none">
            2 dari 3
          </span>
          <span className="font-normal text-[14px] leading-5 text-secondary select-none">
            Sumatera Barat
          </span>
        </div>
      </div>

      <div className="w-full flex-1 flex flex-col items-center justify-center px-4 sm:px-10 py-10 sm:py-16 md:py-20">
        <div className="w-full max-w-[560px] flex flex-col items-center">
          <h1 className="max-w-[440px] font-semibold text-4xl sm:text-6xl md:text-[72px] leading-tight md:leading-[76px] tracking-[-2.16px] text-text text-center mb-10 sm:mb-14">
            Berapa tawarannya?
          </h1>

          <div className="w-full flex flex-col gap-8">
            {/* 1. Posisi */}
            <div className="w-full flex flex-col gap-2.5">
              <label htmlFor="posisi-input" className="font-semibold text-[14px] leading-5 text-text">
                Posisi <span className="font-normal text-secondary">(opsional)</span>
              </label>
              <input
                id="posisi-input"
                type="text"
                value={posisi}
                onChange={(e) => setPosisi(e.target.value)}
                placeholder="Contoh: Admin Toko Online"
                autoComplete="off"
                maxLength={80}
                className="w-full h-12 px-5 bg-surface rounded-full text-[16px] text-text placeholder:text-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
              <p className="px-1 text-[13px] leading-5 text-secondary">
                Dipakai untuk latihan negosiasi. Tidak memengaruhi perhitungan.
              </p>
            </div>

            {/* 2. Status kerja */}
            <div className="w-full flex flex-col gap-2.5">
              <span id="status-label" className="font-semibold text-[14px] leading-5 text-text">
                Status kerja
              </span>
              <div
                role="radiogroup"
                aria-labelledby="status-label"
                className="w-full p-1.5 bg-surface rounded-[26px] sm:rounded-full grid grid-cols-2 sm:flex sm:h-[52px] items-center gap-1"
              >
                {STATUS_OPTIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={status === item.id}
                    onClick={() => handleStatusChange(item.id)}
                    className={segBtn(status === item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="px-1 text-[13px] leading-5 text-secondary">{bantuanStatus}</p>
            </div>

            {/* 2b. Hari kerja (khusus harian) */}
            {status === 'harian' && (
              <div className="w-full flex flex-col gap-2.5">
                <span id="hari-label" className="font-semibold text-[14px] leading-5 text-text">
                  Hari kerja per minggu
                </span>
                <div
                  role="radiogroup"
                  aria-labelledby="hari-label"
                  className="w-full h-[52px] p-1.5 bg-surface rounded-full flex items-center gap-1"
                >
                  {([6, 5] as const).map((h) => (
                    <button
                      key={h}
                      type="button"
                      role="radio"
                      aria-checked={hariKerja === h}
                      onClick={() => setHariKerja(h)}
                      className={segBtn(hariKerja === h)}
                    >
                      {h} hari
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Nominal */}
            <div className="w-full flex flex-col gap-3">
              <div className="w-full bg-surface rounded-xl p-6 sm:p-8 flex flex-col justify-center">
                <label
                  htmlFor="gaji-input"
                  className="font-semibold text-[12px] leading-4 tracking-[1.2px] uppercase text-secondary mb-2 select-none"
                >
                  {status === 'magang' ? 'UANG SAKU' : 'NOMINAL TAWARAN'}
                </label>
                <input
                  id="gaji-input"
                  type="text"
                  inputMode="numeric"
                  value={nominalInput}
                  onChange={handleNominalChange}
                  autoComplete="off"
                  className="w-full bg-transparent font-semibold text-4xl sm:text-[48px] leading-[52px] tracking-[-1.2px] text-text placeholder:text-secondary/40 focus:outline-none"
                  placeholder={PLACEHOLDER[satuan]}
                />
              </div>

              <div className="px-1 flex items-center justify-between text-sm">
                <span className="font-normal text-[14px] leading-5 text-secondary">
                  {LABEL_SATUAN[satuan]} · Sumatera Barat
                </span>
                <span className="font-semibold text-[12px] leading-4 tracking-[0.6px] uppercase text-secondary select-none">
                  RUPIAH
                </span>
              </div>
              {status !== 'magang' && (
                <p className="px-1 text-[13px] leading-5 text-secondary">
                  Isi gaji pokok ditambah tunjangan tetap, sebelum potongan BPJS dan pajak.
                </p>
              )}
              {peringatan && (
                <p className="px-4 py-2.5 bg-warning/10 text-warning text-[13px] leading-5 rounded-2xl">
                  {peringatan}
                </p>
              )}
            </div>

            {/* 4. Skala tempat kerja */}
            <div className="w-full flex flex-col gap-2.5">
              <span id="skala-label" className="font-semibold text-[14px] leading-5 text-text">
                Skala tempat kerja
              </span>
              <div
                role="radiogroup"
                aria-labelledby="skala-label"
                className="w-full min-h-[52px] p-1.5 bg-surface rounded-full flex items-center gap-1"
              >
                {SKALA_OPTIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={skala === item.id}
                    onClick={() => setSkala(item.id)}
                    className={segBtn(skala === item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="px-1 text-[13px] leading-5 text-secondary">{BANTUAN_SKALA[skala]}</p>
            </div>

            {/* 5. Aksi */}
            <div className="w-full pt-8 flex flex-col items-center gap-4">
              <Button
                onClick={handleBandingkan}
                disabled={nominal <= 0}
                className="w-full sm:!w-[200px] sm:!min-w-[200px] !px-0"
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

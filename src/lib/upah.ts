import upahData from '../data/upah-minimum.json';

export type JenisPekerjaan = 'penuh_waktu' | 'paruh_waktu' | 'magang' | 'harian' | 'tidak_tahu';
export type SkalaUsaha = 'mikro_kecil' | 'menengah_besar' | 'tidak_tahu';
export type SatuanUpah = 'bulan' | 'hari' | 'jam';

export interface HitungUpahInput {
  /** Nominal tawaran sesuai satuan status kerja (per bulan / per hari / per jam). */
  gajiBulanan: number;
  jenisPekerjaan: JenisPekerjaan;
  skalaUsaha: SkalaUsaha;
  /** Untuk tawaran kerja baru selalu true. Dipertahankan untuk kompatibilitas. */
  masaKerjaKurang1Tahun: boolean;
  /** Khusus pekerja harian: 6 hari (÷25) atau 5 hari (÷21) per minggu. Default 6. */
  hariKerjaPerMinggu?: 5 | 6;
}

export type PosisiPatokan = 'di_bawah' | 'setara' | 'di_atas' | 'perlu_dicek';

export interface HitungUpahResult {
  /** Patokan dalam satuan yang sama dengan nominal tawaran. */
  nominalPatokan: number;
  selisih: number;
  posisi: PosisiPatokan;
  labelPosisi: string;
  /** Alasan singkat bila posisi = perlu_dicek */
  alasan?: string;
  satuan: SatuanUpah;
  /** Pembagi konversi UMP bulanan (126 / 25 / 21), null jika bulanan. */
  pembagi: number | null;
  /** Penjelasan asal patokan, mis. "UMP Sumatera Barat 2026 ÷ 126 (per jam)". */
  keteranganPatokan: string;
  /** true jika UMP wajib berlaku untuk kondisi ini. */
  wajibUmp: boolean;
}

const dataUmp = upahData.find((u) => u.id === 'sumbar-2026');
const dataUmsp = upahData.find((u) => u.id === 'sumbar-umsp-2026');

/** UMP Sumatera Barat 2026 — SK Gubernur Sumbar No. 562-851-2025 */
export const UMP_SUMBAR_2026 = dataUmp?.nominal ?? 3182955;
export const SUMBER_UMP_SUMBAR_2026 =
  dataUmp?.sumber ?? 'SK Gubernur Sumbar Nomor 562-851-2025';

/** UMSP Sumatera Barat 2026 (dua sektor usaha) — SK Gubernur Sumbar No. 562-853-2025 */
export const UMSP_SUMBAR_2026 = dataUmsp?.nominal ?? 3214846;
export const SUMBER_UMSP_SUMBAR_2026 =
  dataUmsp?.sumber ?? 'SK Gubernur Sumbar Nomor 562-853-2025';

/** Pembagi konversi upah (PP 36/2021): per jam paruh waktu ÷126; harian ÷25 (6 hari) atau ÷21 (5 hari). */
export const PEMBAGI_PER_JAM = 126;
export const PEMBAGI_HARIAN_6 = 25;
export const PEMBAGI_HARIAN_5 = 21;

export function satuanUntuk(jenis: JenisPekerjaan): SatuanUpah {
  if (jenis === 'paruh_waktu') return 'jam';
  if (jenis === 'harian') return 'hari';
  return 'bulan';
}

export const LABEL_SATUAN: Record<SatuanUpah, string> = {
  bulan: 'per bulan',
  hari: 'per hari',
  jam: 'per jam',
};

/** Patokan UMP dalam satuan status kerja. */
export function patokanUntuk(
  jenis: JenisPekerjaan,
  hariKerjaPerMinggu: 5 | 6 = 6
): { nominal: number; pembagi: number | null; keterangan: string } {
  if (jenis === 'paruh_waktu') {
    return {
      nominal: Math.round(UMP_SUMBAR_2026 / PEMBAGI_PER_JAM),
      pembagi: PEMBAGI_PER_JAM,
      keterangan: `UMP Sumatera Barat 2026 ÷ ${PEMBAGI_PER_JAM} (upah per jam)`,
    };
  }
  if (jenis === 'harian') {
    const pembagi = hariKerjaPerMinggu === 5 ? PEMBAGI_HARIAN_5 : PEMBAGI_HARIAN_6;
    return {
      nominal: Math.round(UMP_SUMBAR_2026 / pembagi),
      pembagi,
      keterangan: `UMP Sumatera Barat 2026 ÷ ${pembagi} (upah harian, ${hariKerjaPerMinggu} hari kerja/minggu)`,
    };
  }
  return { nominal: UMP_SUMBAR_2026, pembagi: null, keterangan: 'UMP Sumatera Barat 2026' };
}

export function hitungPatokanUpah(input: HitungUpahInput): HitungUpahResult {
  if (!Number.isFinite(input.gajiBulanan) || input.gajiBulanan <= 0) {
    throw new Error('Gaji bulanan harus berupa angka lebih besar dari nol.');
  }

  const satuan = satuanUntuk(input.jenisPekerjaan);
  const patokan = patokanUntuk(input.jenisPekerjaan, input.hariKerjaPerMinggu ?? 6);
  const nominalPatokan = patokan.nominal;
  const selisih = input.gajiBulanan - nominalPatokan;

  const dasar = {
    nominalPatokan,
    selisih,
    satuan,
    pembagi: patokan.pembagi,
  };

  // Kondisi di mana UMP tidak wajib / belum bisa dipastikan → "Perlu dicek".
  // Selisih tetap dihitung sebagai pembanding.
  let alasan: string | null = null;
  if (input.jenisPekerjaan === 'magang') {
    alasan = 'Peserta magang menerima uang saku, bukan upah, sehingga UMP tidak wajib. Angka UMP hanya sebagai pembanding.';
  } else if (input.jenisPekerjaan === 'tidak_tahu') {
    alasan = 'Status kerja belum diketahui, jadi patokan UMP belum bisa dipastikan.';
  } else if (input.skalaUsaha === 'mikro_kecil') {
    alasan = 'Usaha mikro dan kecil boleh menetapkan upah lewat kesepakatan, dengan batas bawah tertentu. UMP hanya sebagai pembanding.';
  } else if (input.skalaUsaha === 'tidak_tahu') {
    alasan = 'Skala usaha belum diketahui. Usaha menengah dan besar wajib membayar minimal UMP, sedangkan usaha mikro dan kecil tidak.';
  } else if (!input.masaKerjaKurang1Tahun) {
    alasan = 'Untuk masa kerja 1 tahun atau lebih, upah mengikuti struktur dan skala upah perusahaan.';
  }

  if (alasan) {
    return {
      ...dasar,
      posisi: 'perlu_dicek',
      labelPosisi: 'Perlu dicek',
      alasan,
      keteranganPatokan: `Pembanding: ${patokan.keterangan}`,
      wajibUmp: false,
    };
  }

  const wajib = { ...dasar, keteranganPatokan: patokan.keterangan, wajibUmp: true };

  if (selisih < 0) {
    return { ...wajib, posisi: 'di_bawah', labelPosisi: 'Di bawah patokan' };
  }
  if (selisih === 0) {
    return { ...wajib, posisi: 'setara', labelPosisi: 'Setara' };
  }
  return { ...wajib, posisi: 'di_atas', labelPosisi: 'Di atas patokan' };
}

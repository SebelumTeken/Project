import upahData from '../data/upah-minimum.json';

export interface HitungUpahInput {
  gajiBulanan: number;
  jenisPekerjaan: 'penuh_waktu' | 'paruh_waktu' | 'magang' | 'harian' | 'tidak_tahu';
  skalaUsaha: 'mikro_kecil' | 'menengah_besar' | 'tidak_tahu';
  masaKerjaKurang1Tahun: boolean;
}

export type PosisiPatokan = 'di_bawah' | 'setara' | 'di_atas' | 'perlu_dicek';

export interface HitungUpahResult {
  nominalPatokan: number;
  selisih: number;
  posisi: PosisiPatokan;
  labelPosisi: string;
}

export const UMP_SUMBAR_2026 =
  upahData.find((u) => u.id === 'sumbar-2026')?.nominal ?? 3182955;

export function hitungPatokanUpah(input: HitungUpahInput): HitungUpahResult {
  const nominalPatokan = UMP_SUMBAR_2026;
  const selisih = input.gajiBulanan - nominalPatokan;

  // Jika jenis pekerjaan bukan penuh_waktu, skala usaha mikro_kecil atau tidak_tahu,
  // atau masa kerja bukan kurang dari 1 tahun: posisi = perlu_dicek
  if (
    input.jenisPekerjaan !== 'penuh_waktu' ||
    input.skalaUsaha === 'mikro_kecil' ||
    input.skalaUsaha === 'tidak_tahu' ||
    !input.masaKerjaKurang1Tahun
  ) {
    return {
      nominalPatokan,
      selisih,
      posisi: 'perlu_dicek',
      labelPosisi: 'Perlu dicek',
    };
  }

  if (selisih < 0) {
    return {
      nominalPatokan,
      selisih,
      posisi: 'di_bawah',
      labelPosisi: 'Di bawah patokan',
    };
  }

  if (selisih === 0) {
    return {
      nominalPatokan,
      selisih,
      posisi: 'setara',
      labelPosisi: 'Setara',
    };
  }

  return {
    nominalPatokan,
    selisih,
    posisi: 'di_atas',
    labelPosisi: 'Di atas patokan',
  };
}

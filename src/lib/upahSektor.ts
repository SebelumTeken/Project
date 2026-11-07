import dataSektor from '../data/upah-sektor.json';
import { UMP_SUMBAR_2026, type JenisPekerjaan } from './upah';

/** Format rupiah lokal, sama dengan format di halaman lain: "Rp2.839.730". */
export const formatRupiahPasar = (n: number) => `Rp${Math.round(n).toLocaleString('id-ID')}`;

/**
 * Pembanding pasar dari BPS. Ini KONTEKS, bukan patokan hukum.
 * Patokan hukum tetap UMP lewat hitungPatokanUpah() di upah.ts (tidak diubah oleh file ini).
 * Semua angka dihitung di sini, AI hanya menerima hasil jadi.
 *
 * Rata-rata BPS adalah upah/gaji bersih SEBULAN buruh/karyawan. Karena itu pembanding
 * hanya dipakai untuk status penuh waktu, yang nominalnya per bulan. Paruh waktu (per jam),
 * harian (per hari), dan magang (uang saku) tidak dibandingkan.
 */

export interface SektorUsaha {
  kode: string;
  label: string;
  contoh: string;
  rata_nasional: number;
}

export type KodeSektor = string; // salah satu kode di upah-sektor.json, atau 'tidak_tahu'

/** Bagian TawaranData yang dibutuhkan. Ditulis terpisah supaya tidak bergantung pada types.ts. */
export interface TawaranUntukPasar {
  gaji_bulanan: number;
  jenis_pekerjaan: JenisPekerjaan;
  sektor_usaha?: string | null;
}

export const DAFTAR_SEKTOR: SektorUsaha[] = dataSektor.sektor;
export const PERIODE_DATA_SEKTOR = dataSektor.periode;
export const RATA_NASIONAL = dataSektor.rata_nasional;
export const RATA_SUMBAR = dataSektor.rata_sumbar;

/** Persentase rata-rata Sumbar terhadap nasional, dibulatkan (87 untuk Agustus 2025). */
export const PERSEN_SUMBAR_TERHADAP_NASIONAL = Math.round((RATA_SUMBAR / RATA_NASIONAL) * 100);

export function cariSektor(kode: KodeSektor | null | undefined): SektorUsaha | null {
  if (!kode || kode === 'tidak_tahu') return null;
  return DAFTAR_SEKTOR.find((s) => s.kode === kode) ?? null;
}

/** true hanya untuk status yang nominalnya gaji bulanan pekerja (penuh waktu). */
export function bisaDibandingkanDenganRataRata(jenis: JenisPekerjaan): boolean {
  return jenis === 'penuh_waktu';
}

export interface PembandingPasar {
  sektor: SektorUsaha;
  rataNasionalSektor: number;
  rataSumbarSemuaSektor: number;
  /** Gaji tawaran sebagai persen dari rata-rata nasional sektor, dibulatkan. */
  persenDariRataNasional: number;
  /** true jika rata-rata nasional sektor ini sendiri di bawah UMP Sumbar. */
  rataSektorDiBawahUmp: boolean;
  catatan: string[];
}

/**
 * Untuk layar hasil. Mengembalikan null (kartu tidak ditampilkan) jika:
 * status bukan penuh waktu, bidang usaha tidak diketahui, atau gaji tidak valid.
 */
export function bandingkanDenganRataRata(
  gajiBulanan: number,
  kode: KodeSektor | null | undefined,
  jenisPekerjaan: JenisPekerjaan
): PembandingPasar | null {
  if (!bisaDibandingkanDenganRataRata(jenisPekerjaan)) return null;
  const sektor = cariSektor(kode);
  if (!sektor || !Number.isFinite(gajiBulanan) || gajiBulanan <= 0) return null;

  const rataSektorDiBawahUmp = sektor.rata_nasional < UMP_SUMBAR_2026;
  const catatan = [
    `Rata-rata ini angka nasional. Rata-rata upah di Sumatera Barat sekitar ${PERSEN_SUMBAR_TERHADAP_NASIONAL}% dari rata-rata nasional.`,
  ];
  if (rataSektorDiBawahUmp) {
    catatan.push(
      'Rata-rata sektor ini lebih rendah dari UMP Sumbar, karena mencakup pekerja yang dibayar di bawah UMP. Jadi rata-rata ini bukan patokan layak.'
    );
  }

  return {
    sektor,
    rataNasionalSektor: sektor.rata_nasional,
    rataSumbarSemuaSektor: RATA_SUMBAR,
    persenDariRataNasional: Math.round((gajiBulanan / sektor.rata_nasional) * 100),
    rataSektorDiBawahUmp,
    catatan,
  };
}

/**
 * Baris tambahan untuk blok KONTEKS TAWARAN di prompt HRD dan evaluator.
 * Hanya angka yang relevan, bukan seluruh tabel. Mengembalikan [] jika tawaran null.
 */
export function buatKonteksPasarUntukAi(tawaran: TawaranUntukPasar | null | undefined): string[] {
  if (!tawaran) return [];

  if (!bisaDibandingkanDenganRataRata(tawaran.jenis_pekerjaan)) {
    return [
      '- Rata-rata upah BPS: tidak dipakai, karena rata-rata BPS adalah gaji bulanan pekerja dan tidak sebanding dengan status kerja ini',
    ];
  }

  const hasil = bandingkanDenganRataRata(
    tawaran.gaji_bulanan,
    tawaran.sektor_usaha,
    tawaran.jenis_pekerjaan
  );
  if (!hasil) {
    return ['- Bidang usaha perusahaan: belum diketahui (tidak ada data rata-rata upah bidang ini)'];
  }

  return [
    `- Bidang usaha perusahaan: ${hasil.sektor.label}`,
    `- Rata-rata upah nasional bidang ini (BPS, ${PERIODE_DATA_SEKTOR}): ${formatRupiahPasar(hasil.rataNasionalSektor)}`,
    `- Rata-rata upah semua bidang di Sumatera Barat (BPS, ${PERIODE_DATA_SEKTOR}): ${formatRupiahPasar(hasil.rataSumbarSemuaSektor)}`,
    `- Gaji tawaran = ${hasil.persenDariRataNasional}% dari rata-rata nasional bidang ini`,
    ...hasil.catatan.map((c) => `- Catatan: ${c}`),
  ];
}

/** Aturan pemakaian data upah, ditempel sebagai blok terpisah ke prompt HRD dan evaluator. */
export const ATURAN_DATA_UPAH = `ATURAN DATA UPAH:
- Gunakan hanya angka yang tertulis di KONTEKS TAWARAN. Jangan menyebut angka gaji, rata-rata, atau persentase lain dari pengetahuanmu sendiri.
- Jika KONTEKS TAWARAN menyebut UMP wajib berlaku, UMP adalah batas bawah hukum. Rata-rata BPS hanya gambaran pasar, bukan standar gaji layak.
- Rata-rata nasional atau rata-rata Sumatera Barat tidak boleh dipakai untuk membenarkan tawaran di bawah UMP.
- Saat menyebut rata-rata, selalu sebut bahwa itu rata-rata nasional atau rata-rata Sumatera Barat sesuai konteks.
- Jika KONTEKS TAWARAN tidak memuat angka rata-rata BPS, jangan membahas rata-rata upah.`;

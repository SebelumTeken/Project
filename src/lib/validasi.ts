import tandaBahayaData from '../data/tanda-bahaya.json';
import { AiLowonganAnalysis } from './schemas';
import { TandaBahayaItem, TemuanItem, LowonganData } from '../types';
import { TandaBahayaListSchema } from './schemas';
import {
  alasanTolakTemuanAi,
  cariKutipanAsli,
  deteksiDenganAturan,
  KODE_DIPASTIKAN_ATURAN,
} from './deteksiLowongan';

const tandaBahaya = TandaBahayaListSchema.parse(tandaBahayaData);

export interface TemuanDibuang {
  kode_tanda: string;
  kutipan: string;
  alasan: string;
}

/** Ringkasan asal temuan, untuk log di console saat pengujian. */
export interface DiagnosisTemuan {
  /** Kode tanda yang ditemukan AI dan lolos validasi. */
  dariAi: string[];
  /** Kode tanda yang ditambahkan oleh aturan di kode (tidak ditemukan AI). */
  dariAturan: string[];
  /** Temuan AI yang dibuang beserta alasannya. */
  dibuang: TemuanDibuang[];
}

/** Mencocokkan kode dari AI ke daftar, termasuk variasi kecil seperti "Biaya-Di-Awal" atau label. */
function cariTanda(kode: string, daftar: TandaBahayaItem[]): TandaBahayaItem | undefined {
  const bersih = kode.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return (
    daftar.find((tanda) => tanda.kode === bersih) ??
    daftar.find((tanda) => tanda.label.toLowerCase() === kode.trim().toLowerCase())
  );
}

/** Memisahkan temuan AI yang valid dan yang dibuang (beserta alasannya). */
export function periksaTemuan(
  temuan: AiLowonganAnalysis['temuan'],
  teksTerbaca: string,
  daftarTandaBahaya: TandaBahayaItem[] = tandaBahaya
): { diterima: TemuanItem[]; dibuang: TemuanDibuang[] } {
  const diterima: TemuanItem[] = [];
  const dibuang: TemuanDibuang[] = [];

  temuan.forEach((item, index) => {
    const tanda = cariTanda(item.kode_tanda, daftarTandaBahaya);
    if (!tanda) {
      dibuang.push({ ...ringkasItem(item), alasan: 'kode tidak ada di daftar tanda bahaya' });
      return;
    }

    // Kutipan diganti dengan potongan asli poster supaya bisa digarisbawahi di layar.
    const kutipan = cariKutipanAsli(item.kutipan, teksTerbaca);
    if (!kutipan) {
      dibuang.push({ ...ringkasItem(item), alasan: 'kutipan tidak ditemukan di teks poster' });
      return;
    }

    diterima.push({
      id: `temuan-${index + 1}`,
      kode_tanda: tanda.kode,
      bobot: tanda.bobot,
      judul: tanda.label,
      kutipan,
      penjelasan: item.penjelasan,
    });
  });

  return { diterima, dibuang };
}

function ringkasItem(item: AiLowonganAnalysis['temuan'][number]) {
  return { kode_tanda: item.kode_tanda, kutipan: item.kutipan };
}

export function validasiTemuan(
  temuan: AiLowonganAnalysis['temuan'],
  teksTerbaca: string,
  daftarTandaBahaya: TandaBahayaItem[] = tandaBahaya
): TemuanItem[] {
  return periksaTemuan(temuan, teksTerbaca, daftarTandaBahaya).diterima;
}

export function tentukanTingkatPerhatian(
  temuan: TemuanItem[]
): LowonganData['tingkat_perhatian'] {
  if (temuan.some((item) => item.bobot === 'tinggi')) {
    return 'tinggi';
  }

  if (temuan.some((item) => item.bobot === 'sedang')) {
    return 'sedang';
  }

  return 'rendah';
}

/**
 * Menggabungkan temuan AI (yang lolos validasi) dengan temuan aturan.
 * Satu temuan per kode tanda; temuan AI didahulukan karena penjelasannya lebih spesifik.
 */
export function analisisKeLowongan(
  analisis: AiLowonganAnalysis,
  gambarData?: string,
  daftarTandaBahaya: TandaBahayaItem[] = tandaBahaya
): { data: LowonganData; diagnosis: DiagnosisTemuan } {
  const { diterima, dibuang } = periksaTemuan(
    analisis.temuan,
    analisis.teks_terbaca,
    daftarTandaBahaya
  );

  const temuanAturan = deteksiDenganAturan(analisis);
  const kodeAturan = new Set(temuanAturan.map((item) => item.kode_tanda));

  const temuan: TemuanItem[] = [];
  const kodeTercatat = new Set<string>();
  for (const item of diterima) {
    if (kodeTercatat.has(item.kode_tanda)) continue;

    // Tanda yang bisa dicek dari teks: hanya dipakai jika aturan juga menemukannya.
    if (KODE_DIPASTIKAN_ATURAN.has(item.kode_tanda) && !kodeAturan.has(item.kode_tanda)) {
      dibuang.push({
        kode_tanda: item.kode_tanda,
        kutipan: item.kutipan,
        alasan: 'tidak terbukti dari teks poster',
      });
      continue;
    }
    const alasan = alasanTolakTemuanAi(item.kode_tanda, item.kutipan);
    if (alasan) {
      dibuang.push({ kode_tanda: item.kode_tanda, kutipan: item.kutipan, alasan });
      continue;
    }

    temuan.push(item);
    kodeTercatat.add(item.kode_tanda);
  }
  const dariAi = [...kodeTercatat];

  const dariAturan: string[] = [];
  for (const item of temuanAturan) {
    const tanda = daftarTandaBahaya.find((data) => data.kode === item.kode_tanda);
    if (!tanda) continue;

    if (kodeTercatat.has(tanda.kode)) {
      // AI sudah menemukan tanda ini, tetapi aturan melihat konteks yang lebih berat
      // (misalnya nama perusahaan besar dicatut): naikkan bobot dan pakai penjelasan aturan.
      const ada = temuan.find((t) => t.kode_tanda === tanda.kode);
      if (ada && item.bobot === 'tinggi' && ada.bobot !== 'tinggi') {
        ada.bobot = 'tinggi';
        ada.penjelasan = item.penjelasan;
      }
      continue;
    }

    temuan.push({
      id: `temuan-aturan-${dariAturan.length + 1}`,
      kode_tanda: tanda.kode,
      bobot: item.bobot ?? tanda.bobot,
      judul: tanda.label,
      kutipan: item.kutipan,
      penjelasan: item.penjelasan,
    });
    kodeTercatat.add(tanda.kode);
    dariAturan.push(tanda.kode);
  }

  return {
    data: {
      teks_terbaca: analisis.teks_terbaca,
      nama_perusahaan: analisis.nama_perusahaan,
      posisi: analisis.posisi,
      lokasi: analisis.lokasi,
      gaji_tertulis: analisis.gaji_tertulis,
      kontak: analisis.kontak,
      tingkat_perhatian: tentukanTingkatPerhatian(temuan),
      ringkasan: analisis.ringkasan,
      temuan,
      gambar_data: gambarData,
    },
    diagnosis: { dariAi, dariAturan, dibuang },
  };
}

export function buatDataLowongan(
  analisis: AiLowonganAnalysis,
  gambarData?: string
): LowonganData {
  return analisisKeLowongan(analisis, gambarData).data;
}

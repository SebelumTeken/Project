import tandaBahayaData from '../data/tanda-bahaya.json';
import { AiLowonganAnalysis } from './schemas';
import { TandaBahayaItem, TemuanItem, LowonganData } from '../types';
import { TandaBahayaListSchema } from './schemas';

const tandaBahaya = TandaBahayaListSchema.parse(tandaBahayaData);

function normalisasiTeks(value: string): string {
  return value.normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function validasiTemuan(
  temuan: AiLowonganAnalysis['temuan'],
  teksTerbaca: string,
  daftarTandaBahaya: TandaBahayaItem[] = tandaBahaya
): TemuanItem[] {
  const teksNormal = normalisasiTeks(teksTerbaca);

  return temuan.flatMap((item, index) => {
    const tanda = daftarTandaBahaya.find((data) => data.kode === item.kode_tanda);
    const kutipanNormal = normalisasiTeks(item.kutipan);

    if (!tanda || !kutipanNormal || !teksNormal.includes(kutipanNormal)) {
      return [];
    }

    return [
      {
        id: `temuan-${index + 1}`,
        kode_tanda: tanda.kode,
        bobot: tanda.bobot,
        judul: tanda.label,
        kutipan: item.kutipan,
        penjelasan: item.penjelasan,
      },
    ];
  });
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

export function buatDataLowongan(
  analisis: AiLowonganAnalysis,
  gambarData?: string
): LowonganData {
  const temuan = validasiTemuan(analisis.temuan, analisis.teks_terbaca);

  return {
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
  };
}

import type { HitungUpahInput, HitungUpahResult } from './upah';
import { LABEL_SATUAN } from './upah';

export interface PertanyaanTawaran {
  judul: string;
  penjelasan: string;
}

const rupiah = (n: number) => `Rp${Math.abs(n).toLocaleString('id-ID')}`;

/**
 * Menyusun pertanyaan untuk HRD berdasarkan isi tawaran dan hasil perbandingan.
 * Diurutkan dari yang paling relevan; diambil maksimal `maks` pertanyaan.
 */
export function buatPertanyaanTawaran(
  input: HitungUpahInput,
  hasil: HitungUpahResult,
  maks = 3
): PertanyaanTawaran[] {
  const daftar: PertanyaanTawaran[] = [];

  // 1. Konteks jenis pekerjaan / skala usaha / masa kerja
  if (input.jenisPekerjaan === 'magang') {
    daftar.push({
      judul: 'Ada perjanjian magang tertulis?',
      penjelasan:
        'Pastikan program, durasi, uang saku, dan sertifikat magang tercantum dalam perjanjian tertulis.',
    });
  } else if (input.jenisPekerjaan === 'paruh_waktu') {
    daftar.push({
      judul: 'Berapa jam kerja per minggu?',
      penjelasan:
        'Upah paruh waktu dihitung per jam. Pastikan jumlah jam dan tarif per jam tertulis jelas.',
    });
  } else if (input.jenisPekerjaan === 'harian') {
    daftar.push({
      judul: 'Berapa hari kerja dalam sebulan?',
      penjelasan:
        'Upah harian bergantung pada jumlah hari kerja. Tanyakan tarif per hari dan cara pembayarannya.',
    });
  } else if (input.jenisPekerjaan === 'tidak_tahu') {
    daftar.push({
      judul: 'Apa status kerja posisi ini?',
      penjelasan:
        'Tanyakan apakah posisi ini penuh waktu, paruh waktu, harian, atau magang, serta jenis kontraknya.',
    });
  }

  if (input.skalaUsaha === 'mikro_kecil') {
    daftar.push({
      judul: 'Apakah upah disepakati tertulis?',
      penjelasan:
        'Usaha mikro dan kecil boleh menetapkan upah berdasarkan kesepakatan. Minta kesepakatan itu tertulis.',
    });
  } else if (input.skalaUsaha === 'tidak_tahu') {
    daftar.push({
      judul: 'Berapa skala perusahaannya?',
      penjelasan:
        'Tanyakan jumlah karyawan dan status badan usaha. Usaha mikro dan kecil dikecualikan dari UMP.',
    });
  }

  if (!input.masaKerjaKurang1Tahun && input.jenisPekerjaan === 'penuh_waktu') {
    daftar.push({
      judul: 'Bagaimana struktur dan skala upahnya?',
      penjelasan:
        'Untuk masa kerja 1 tahun atau lebih, upah mengikuti struktur dan skala upah perusahaan, bukan sekadar UMP.',
    });
  }

  // 2. Posisi terhadap UMP
  if (hasil.wajibUmp && hasil.selisih < 0) {
    daftar.push({
      judul: 'Ini gaji masa percobaan?',
      penjelasan: `Tawaran ini ${rupiah(hasil.selisih)} ${LABEL_SATUAN[hasil.satuan]} di bawah patokan UMP. Upah masa percobaan pun tidak boleh di bawah upah minimum.`,
    });
  } else if (input.jenisPekerjaan !== 'magang') {
    daftar.push({
      judul: 'Ini gaji pokok atau total?',
      penjelasan:
        'Pastikan apakah nominal ini gaji pokok saja atau sudah termasuk tunjangan dan potongan.',
    });
  }

  // 3. Pertanyaan umum yang selalu relevan
  daftar.push({
    judul: 'Ada tunjangan tetap?',
    penjelasan:
      'Gaji pokok minimal 75% dari gaji pokok ditambah tunjangan tetap. Tanyakan rinciannya.',
  });
  daftar.push({
    judul: 'Apakah didaftarkan BPJS?',
    penjelasan:
      'Tanyakan kepesertaan BPJS Kesehatan dan BPJS Ketenagakerjaan sejak hari pertama bekerja.',
  });
  daftar.push({
    judul: 'Kapan gaji ditinjau?',
    penjelasan:
      'Tanyakan jadwal evaluasi kinerja dan penyesuaian gaji, misalnya setiap tahun.',
  });

  return daftar.slice(0, maks);
}

import type { HitungUpahInput, HitungUpahResult } from './upah';
import { LABEL_SATUAN, UMP_SUMBAR_2026 } from './upah';

export interface AturanItem {
  judul: string;
  isi: string;
}

const rp = (n: number) => `Rp${Math.round(n).toLocaleString('id-ID')}`;

const KRITERIA_SKALA =
  'Usaha mikro: modal ≤ Rp1 miliar atau omzet ≤ Rp2 miliar per tahun. Usaha kecil: modal ≤ Rp5 miliar atau omzet ≤ Rp15 miliar per tahun. Di atas itu termasuk usaha menengah/besar yang wajib membayar minimal UMP.';

/**
 * Ringkasan aturan upah yang relevan dengan tawaran.
 * Ringkasan umum (UU 6/2023, PP 35/2021, PP 36/2021, PP 7/2021, Permenaker 6/2020),
 * bukan nasihat hukum.
 */
export function buatRingkasanAturan(
  input: HitungUpahInput,
  hasil: HitungUpahResult
): AturanItem[] {
  // ── Magang ──
  if (input.jenisPekerjaan === 'magang') {
    return [
      {
        judul: 'Uang saku, bukan upah',
        isi: 'Peserta magang menerima uang saku, sehingga UMP tidak wajib berlaku.',
      },
      {
        judul: 'Perjanjian magang tertulis',
        isi: 'Perjanjian wajib memuat program, durasi, hak dan kewajiban, uang saku, serta sertifikat magang.',
      },
      {
        judul: 'Waspadai magang semu',
        isi: 'Jika tugasnya sama dengan karyawan biasa dan jam kerjanya penuh, tanyakan apakah posisi ini sebenarnya pekerjaan berupah.',
      },
    ];
  }

  // ── Usaha mikro / kecil ──
  if (input.skalaUsaha === 'mikro_kecil') {
    return [
      {
        judul: 'Upah berdasarkan kesepakatan',
        isi: 'Usaha mikro dan kecil boleh menetapkan upah di bawah UMP lewat kesepakatan dengan pekerja.',
      },
      {
        judul: 'Tetap ada batas bawah',
        isi: 'Upah yang disepakati minimal 50% dari rata-rata konsumsi masyarakat provinsi dan minimal 25% di atas garis kemiskinan provinsi.',
      },
      {
        judul: 'Pastikan memang usaha mikro/kecil',
        isi: KRITERIA_SKALA,
      },
      {
        judul: 'Hak lain tetap berlaku',
        isi: 'Minta kesepakatan upah secara tertulis, dan tanyakan kepesertaan BPJS Kesehatan serta BPJS Ketenagakerjaan.',
      },
    ];
  }

  // ── Skala tidak diketahui ──
  if (input.skalaUsaha === 'tidak_tahu') {
    return [
      {
        judul: 'Skala usaha menentukan kewajiban UMP',
        isi: KRITERIA_SKALA,
      },
      {
        judul: 'Cara mengetahuinya',
        isi: 'Tanyakan status badan usaha (PT, CV, perorangan) dan perkiraan jumlah karyawan. Label "UMKM" belum tentu berarti mikro atau kecil.',
      },
    ];
  }

  // ── UMP wajib berlaku ──
  const daftar: AturanItem[] = [];

  if (hasil.posisi === 'di_bawah') {
    daftar.push({
      judul: 'Di bawah upah minimum tidak diperbolehkan',
      isi: 'Usaha menengah dan besar dilarang membayar di bawah upah minimum. Pelanggarannya dapat dikenai sanksi pidana.',
    });
  }

  if (hasil.pembagi) {
    daftar.push({
      judul: 'Cara menghitung patokan',
      isi: `UMP ${rp(UMP_SUMBAR_2026)} ÷ ${hasil.pembagi} = ${rp(hasil.nominalPatokan)} ${LABEL_SATUAN[hasil.satuan]}.`,
    });
  }

  daftar.push(
    {
      judul: 'Yang dibandingkan dengan UMP',
      isi: 'Gaji pokok ditambah tunjangan tetap, sebelum potongan BPJS dan pajak. Uang makan atau transport yang dibayar per kehadiran tidak dihitung.',
    },
    {
      judul: 'Gaji pokok minimal 75%',
      isi: 'Jika ada tunjangan tetap, gaji pokok minimal 75% dari gaji pokok ditambah tunjangan tetap.',
    },
    {
      judul: 'Masa percobaan',
      isi: 'Hanya untuk karyawan tetap (PKWTT), maksimal 3 bulan, dan upahnya tidak boleh di bawah upah minimum. Karyawan kontrak (PKWT) tidak boleh dikenai masa percobaan.',
    },
    {
      judul: 'Jam kerja dan lembur',
      isi: 'Normalnya 40 jam per minggu. Lembur maksimal 4 jam per hari dan 18 jam per minggu, dibayar 1,5× upah per jam untuk jam pertama dan 2× untuk jam berikutnya.',
    },
    {
      judul: 'Hak lain yang wajib',
      isi: 'BPJS Kesehatan, BPJS Ketenagakerjaan, THR (masa kerja minimal 1 bulan), dan kontrak kerja tertulis.',
    }
  );

  return daftar;
}

import { describe, expect, it } from 'vitest';
import { buatDataLowongan, tentukanTingkatPerhatian, validasiTemuan } from './validasi';

describe('validasi lowongan', () => {
  const teksTerbaca =
    'Dicari Admin Toko Online. Biaya seragam Rp150.000. Daftar via WhatsApp.';

  it('keeps only known findings with quotes found in the text', () => {
    const temuan = validasiTemuan(
      [
        {
          kode_tanda: 'biaya_di_awal',
          kutipan: 'Biaya seragam Rp150.000',
          penjelasan: 'Perlu diperiksa.',
        },
        {
          kode_tanda: 'kode_tidak_dikenal',
          kutipan: 'Daftar via WhatsApp',
          penjelasan: 'Tidak valid.',
        },
        {
          kode_tanda: 'pesan_pribadi',
          kutipan: 'Kutipan yang tidak ada',
          penjelasan: 'Tidak valid.',
        },
      ],
      teksTerbaca
    );

    expect(temuan).toHaveLength(1);
    expect(temuan[0].kode_tanda).toBe('biaya_di_awal');
    expect(temuan[0].bobot).toBe('tinggi');
  });

  it('determines attention level from the highest finding weight', () => {
    const lowongan = buatDataLowongan({
      teks_terbaca: teksTerbaca,
      nama_perusahaan: null,
      posisi: 'Admin Toko Online',
      lokasi: 'Padang',
      gaji_tertulis: 8000000,
      kontak: 'WhatsApp',
      ringkasan: 'Perlu diperiksa.',
      temuan: [
        {
          kode_tanda: 'biaya_di_awal',
          kutipan: 'Biaya seragam Rp150.000',
          penjelasan: 'Perlu diperiksa.',
        },
      ],
    });

    expect(tentukanTingkatPerhatian([])).toBe('rendah');
    expect(lowongan.tingkat_perhatian).toBe('tinggi');
    expect(lowongan.temuan[0].judul).toBe('Biaya di awal');
  });
});

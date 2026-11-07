import { describe, expect, it } from 'vitest';
import {
  AiEvaluasiLatihanSchema,
  AiLowonganAnalysisSchema,
} from './schemas';

describe('AI response schemas', () => {
  it('accepts a valid lowongan analysis response', () => {
    const result = AiLowonganAnalysisSchema.safeParse({
      teks_terbaca: 'Dicari Admin Toko Online.',
      nama_perusahaan: null,
      posisi: 'Admin Toko Online',
      lokasi: 'Padang',
      gaji_tertulis: 8000000,
      kontak: 'WhatsApp',
      ringkasan: 'Perlu diperiksa sebelum melamar.',
      temuan: [
        {
          kode_tanda: 'biaya_di_awal',
          kutipan: 'Biaya seragam',
          penjelasan: 'Permintaan biaya di awal perlu diperiksa.',
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('rejects an evaluation score outside the 1 to 5 range', () => {
    const result = AiEvaluasiLatihanSchema.safeParse({
      skor_kejelasan: 6,
      skor_alasan: 3,
      skor_kesopanan: 5,
      masukan: 'Masukan.',
      contoh_kalimat: 'Contoh kalimat.',
    });

    expect(result.success).toBe(false);
  });
});

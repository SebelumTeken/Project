import { describe, it, expect } from 'vitest';
import type { TawaranData } from '../types';
import { buatPromptEvaluasiLatihan, buatPromptHrd } from './prompts';

const tawaran = (o: Partial<TawaranData> = {}): TawaranData => ({
  gaji_bulanan: 2800000,
  jenis_pekerjaan: 'penuh_waktu',
  skala_usaha: 'menengah_besar',
  masa_kerja_kurang_1_tahun: true,
  nominal_patokan: 3182955,
  selisih_patokan: -382955,
  posisi_patokan: 'di_bawah',
  ...o,
});

describe('gambaran pasar di prompt AI', () => {
  it('prompt HRD memuat rata-rata bidang dan aturan data upah', () => {
    const prompt = buatPromptHrd(null, tawaran({ sektor_usaha: 'G' }));
    expect(prompt).toContain('Rata-rata upah nasional bidang ini');
    expect(prompt).toContain('Rp2.839.730');
    expect(prompt).toContain('Rp2.911.450');
    expect(prompt).toContain('bukan patokan layak');
    expect(prompt).toContain('ATURAN DATA UPAH');
    expect(prompt).toContain('ATURAN PERILAKU');
  });

  it('tidak mengirim rata-rata untuk paruh waktu', () => {
    const prompt = buatPromptHrd(
      null,
      tawaran({ gaji_bulanan: 25000, jenis_pekerjaan: 'paruh_waktu', sektor_usaha: 'G' })
    );
    expect(prompt).not.toContain('Rp2.839.730');
    expect(prompt).toContain('tidak dipakai');
  });

  it('tetap aman jika bidang tidak diisi', () => {
    expect(buatPromptHrd(null, tawaran())).toContain('Bidang usaha perusahaan: belum diketahui');
  });

  it('prompt evaluator memuat konteks pasar dan aturan, rubrik tetap ada', () => {
    const prompt = buatPromptEvaluasiLatihan([], null, tawaran({ sektor_usaha: 'G' }));
    expect(prompt).toContain('Rp2.839.730');
    expect(prompt).toContain('ATURAN DATA UPAH');
    expect(prompt).toContain('RUBRIK');
  });

  it('tanpa tawaran, prompt tidak memuat angka rata-rata', () => {
    expect(buatPromptHrd(null, null)).not.toContain('Rata-rata upah nasional');
  });
});

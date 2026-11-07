import { describe, it, expect } from 'vitest';
import { hitungPatokanUpah, UMP_SUMBAR_2026 } from './upah';

describe('hitungPatokanUpah', () => {
  it('has UMP Sumatera Barat 2026 set to 3182955', () => {
    expect(UMP_SUMBAR_2026).toBe(3182955);
  });

  it('returns "Di bawah patokan" when salary is less than UMP for full-time standard conditions', () => {
    const result = hitungPatokanUpah({
      gajiBulanan: 2800000,
      jenisPekerjaan: 'penuh_waktu',
      skalaUsaha: 'menengah_besar',
      masaKerjaKurang1Tahun: true,
    });

    expect(result.posisi).toBe('di_bawah');
    expect(result.labelPosisi).toBe('Di bawah patokan');
    expect(result.selisih).toBe(2800000 - 3182955);
  });

  it('returns "Setara" when salary equals UMP', () => {
    const result = hitungPatokanUpah({
      gajiBulanan: 3182955,
      jenisPekerjaan: 'penuh_waktu',
      skalaUsaha: 'menengah_besar',
      masaKerjaKurang1Tahun: true,
    });

    expect(result.posisi).toBe('setara');
    expect(result.labelPosisi).toBe('Setara');
    expect(result.selisih).toBe(0);
  });

  it('returns "Di atas patokan" when salary exceeds UMP', () => {
    const result = hitungPatokanUpah({
      gajiBulanan: 4000000,
      jenisPekerjaan: 'penuh_waktu',
      skalaUsaha: 'menengah_besar',
      masaKerjaKurang1Tahun: true,
    });

    expect(result.posisi).toBe('di_atas');
    expect(result.labelPosisi).toBe('Di atas patokan');
    expect(result.selisih).toBe(4000000 - 3182955);
  });

  it('returns "Perlu dicek" if job is not full-time', () => {
    const result = hitungPatokanUpah({
      gajiBulanan: 2800000,
      jenisPekerjaan: 'magang',
      skalaUsaha: 'menengah_besar',
      masaKerjaKurang1Tahun: true,
    });

    expect(result.posisi).toBe('perlu_dicek');
    expect(result.labelPosisi).toBe('Perlu dicek');
  });

  it('returns "Perlu dicek" if company size is mikro_kecil or tidak_tahu', () => {
    const resultMikro = hitungPatokanUpah({
      gajiBulanan: 2800000,
      jenisPekerjaan: 'penuh_waktu',
      skalaUsaha: 'mikro_kecil',
      masaKerjaKurang1Tahun: true,
    });
    expect(resultMikro.posisi).toBe('perlu_dicek');

    const resultUnknown = hitungPatokanUpah({
      gajiBulanan: 2800000,
      jenisPekerjaan: 'penuh_waktu',
      skalaUsaha: 'tidak_tahu',
      masaKerjaKurang1Tahun: true,
    });
    expect(resultUnknown.posisi).toBe('perlu_dicek');
  });

  it('returns "Perlu dicek" if tenure is not under 1 year', () => {
    const result = hitungPatokanUpah({
      gajiBulanan: 2800000,
      jenisPekerjaan: 'penuh_waktu',
      skalaUsaha: 'menengah_besar',
      masaKerjaKurang1Tahun: false,
    });

    expect(result.posisi).toBe('perlu_dicek');
    expect(result.labelPosisi).toBe('Perlu dicek');
  });
});


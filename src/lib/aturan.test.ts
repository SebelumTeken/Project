import { describe, it, expect } from 'vitest';
import { hitungPatokanUpah, HitungUpahInput } from './upah';
import { buatRingkasanAturan } from './aturan';
import { balasHrdAturan, buatKonteksLatihan, buatPembuka } from './latihan';
import type { PesanLatihan, TawaranData } from '../types';

const input = (o: Partial<HitungUpahInput>): HitungUpahInput => ({
  gajiBulanan: 2800000,
  jenisPekerjaan: 'penuh_waktu',
  skalaUsaha: 'menengah_besar',
  masaKerjaKurang1Tahun: true,
  ...o,
});

describe('konversi satuan UMP', () => {
  it('paruh waktu dibandingkan per jam (UMP ÷ 126)', () => {
    const h = hitungPatokanUpah(input({ jenisPekerjaan: 'paruh_waktu', gajiBulanan: 20000 }));
    expect(h.satuan).toBe('jam');
    expect(h.nominalPatokan).toBe(25262);
    expect(h.posisi).toBe('di_bawah');
    expect(h.wajibUmp).toBe(true);
  });

  it('harian 6 hari dibandingkan dengan UMP ÷ 25', () => {
    const h = hitungPatokanUpah(input({ jenisPekerjaan: 'harian', gajiBulanan: 130000 }));
    expect(h.satuan).toBe('hari');
    expect(h.nominalPatokan).toBe(127318);
    expect(h.posisi).toBe('di_atas');
  });

  it('harian 5 hari dibandingkan dengan UMP ÷ 21', () => {
    const h = hitungPatokanUpah(
      input({ jenisPekerjaan: 'harian', gajiBulanan: 130000, hariKerjaPerMinggu: 5 })
    );
    expect(h.nominalPatokan).toBe(151569);
    expect(h.posisi).toBe('di_bawah');
  });

  it('usaha mikro/kecil tidak wajib UMP, tetapi selisih tetap dihitung sebagai pembanding', () => {
    const h = hitungPatokanUpah(input({ skalaUsaha: 'mikro_kecil' }));
    expect(h.posisi).toBe('perlu_dicek');
    expect(h.wajibUmp).toBe(false);
    expect(h.selisih).toBe(2800000 - 3182955);
  });
});

describe('ringkasan aturan', () => {
  it('magang menjelaskan uang saku', () => {
    const i = input({ jenisPekerjaan: 'magang' });
    expect(buatRingkasanAturan(i, hitungPatokanUpah(i))[0].judul).toMatch(/uang saku/i);
  });

  it('usaha mikro/kecil menyebut batas bawah kesepakatan', () => {
    const i = input({ skalaUsaha: 'mikro_kecil' });
    const teks = JSON.stringify(buatRingkasanAturan(i, hitungPatokanUpah(i)));
    expect(teks).toContain('garis kemiskinan');
  });

  it('di bawah UMP pada usaha menengah/besar memunculkan larangan', () => {
    const i = input({});
    expect(buatRingkasanAturan(i, hitungPatokanUpah(i))[0].judul).toMatch(/tidak diperbolehkan/i);
  });

  it('paruh waktu menampilkan cara menghitung patokan per jam', () => {
    const i = input({ jenisPekerjaan: 'paruh_waktu', gajiBulanan: 30000 });
    const teks = JSON.stringify(buatRingkasanAturan(i, hitungPatokanUpah(i)));
    expect(teks).toContain('÷ 126');
    expect(teks).toContain('Rp25.262');
  });
});

describe('latihan mengikuti aturan UMP', () => {
  const tawaran = (o: Partial<TawaranData>): TawaranData => ({
    gaji_bulanan: 2800000,
    jenis_pekerjaan: 'penuh_waktu',
    skala_usaha: 'menengah_besar',
    masa_kerja_kurang_1_tahun: true,
    nominal_patokan: 0,
    selisih_patokan: 0,
    posisi_patokan: 'di_bawah',
    ...o,
  });
  const chat = (isi: string): PesanLatihan[] => [
    { id: 'h', pengirim: 'hrd', isi: 'Bagaimana?' },
    { id: 'u', pengirim: 'pengguna', isi },
  ];

  it('HRD usaha mikro tidak menjanjikan penyesuaian ke UMP', () => {
    const ctx = buatKonteksLatihan(null, tawaran({ skala_usaha: 'mikro_kecil' }));
    const balas = balasHrdAturan(ctx, chat('Maaf, ini di bawah UMP.'));
    expect(balas).toMatch(/kesepakatan/i);
    expect(balas).not.toContain('Rp3.182.955');
  });

  it('pembuka paruh waktu memakai satuan per jam dan posisi dari form', () => {
    const ctx = buatKonteksLatihan(
      null,
      tawaran({ jenis_pekerjaan: 'paruh_waktu', gaji_bulanan: 20000, posisi: 'Barista' })
    );
    const isi = buatPembuka(ctx).isi;
    expect(isi).toContain('Barista');
    expect(isi).toContain('Rp20.000 per jam');
  });
});

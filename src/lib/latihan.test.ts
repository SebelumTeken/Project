import { describe, it, expect } from 'vitest';
import type { PesanLatihan, TawaranData } from '../types';
import {
  ambilNominal,
  balasHrdAturan,
  buatKonteksLatihan,
  buatPembuka,
  evaluasiAturan,
} from './latihan';
import { buatPromptEvaluasiLatihan, buatPromptHrd } from './prompts';

const tawaran = (gaji: number): TawaranData => ({
  gaji_bulanan: gaji,
  jenis_pekerjaan: 'penuh_waktu',
  skala_usaha: 'menengah_besar',
  masa_kerja_kurang_1_tahun: true,
  nominal_patokan: 3182955,
  selisih_patokan: gaji - 3182955,
  posisi_patokan: gaji < 3182955 ? 'di_bawah' : 'di_atas',
  pertanyaan: ['Ini gaji masa percobaan?', 'Ada tunjangan tetap?'],
});

const percakapan = (...userTexts: string[]): PesanLatihan[] =>
  userTexts.flatMap((isi, i) => [
    { id: `h${i}`, pengirim: 'hrd' as const, isi: 'Bagaimana?' },
    { id: `u${i}`, pengirim: 'pengguna' as const, isi },
  ]);

describe('ambilNominal', () => {
  it('membaca berbagai format rupiah', () => {
    expect(ambilNominal('Saya harap Rp3.500.000')).toBe(3500000);
    expect(ambilNominal('kira-kira 3,5 juta')).toBe(3500000);
    expect(ambilNominal('4000000 per bulan')).toBe(4000000);
    expect(ambilNominal('saya punya 2 tahun pengalaman')).toBeNull();
  });
});

describe('konteks dan pembuka', () => {
  it('pembuka memakai nominal tawaran asli, bukan data contoh', () => {
    const ctx = buatKonteksLatihan(null, tawaran(4000000));
    expect(buatPembuka(ctx).isi).toContain('Rp4.000.000');
    expect(buatPembuka(ctx).isi).not.toContain('2.800.000');
  });

  it('batas naik minimal sampai UMP jika tawaran di bawah UMP', () => {
    const ctx = buatKonteksLatihan(null, tawaran(2500000));
    expect(ctx.batasNaik).toBe(3182955);
  });
});

describe('balasHrdAturan', () => {
  const ctx = buatKonteksLatihan(null, tawaran(2800000));

  it('menanyakan alasan jika pelamar meminta angka tanpa alasan', () => {
    const balas = balasHrdAturan(ctx, percakapan('Saya mau Rp3.500.000'));
    expect(balas).toMatch(/apa yang membuat|alasan/i);
  });

  it('menyesuaikan ke UMP jika pelamar menyinggung UMP', () => {
    const balas = balasHrdAturan(ctx, percakapan('Mohon maaf, tawaran ini di bawah UMP Sumbar.'));
    expect(balas).toContain('Rp3.182.955');
  });

  it('memberi tawaran balik jika angka melebihi anggaran', () => {
    const balas = balasHrdAturan(
      ctx,
      percakapan('Karena pengalaman saya 3 tahun, saya berharap Rp5.000.000')
    );
    expect(balas).toContain(`Rp${ctx.batasNaik.toLocaleString('id-ID')}`);
  });
});

describe('evaluasiAturan', () => {
  const ctx = buatKonteksLatihan(null, tawaran(2800000));

  it('memberi skor lebih tinggi untuk pesan jelas, beralasan, dan sopan', () => {
    const lemah = evaluasiAturan(ctx, percakapan('nego dong'));
    const kuat = evaluasiAturan(
      ctx,
      percakapan(
        'Terima kasih atas tawarannya. Karena nominal ini di bawah UMP Sumatera Barat, apakah bisa disesuaikan ke Rp3.200.000?'
      )
    );
    expect(kuat.total_skor).toBeGreaterThan(lemah.total_skor);
  });

  it('masukan mengutip kalimat pengguna', () => {
    const hasil = evaluasiAturan(ctx, percakapan('nego dong'));
    expect(hasil.masukan).toContain('"nego dong"');
  });
});

describe('prompt AI', () => {
  it('prompt HRD memuat konteks UMP dan nominal tawaran', () => {
    const prompt = buatPromptHrd(null, tawaran(2800000));
    expect(prompt).toContain('Rp2.800.000');
    expect(prompt).toContain('Rp3.182.955');
  });

  it('prompt evaluasi memuat rubrik dan konteks', () => {
    const prompt = buatPromptEvaluasiLatihan(percakapan('halo'), null, tawaran(2800000));
    expect(prompt).toContain('RUBRIK');
    expect(prompt).toContain('Rp2.800.000');
  });
});

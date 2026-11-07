import { describe, expect, it } from 'vitest';
import {
  cariKutipanAsli,
  cariNominalRupiah,
  deteksiDenganAturan,
  nominalBulananTertinggi,
  pecahSegmen,
} from './deteksiLowongan';

const kodeDari = (teks: string, ekstra: Partial<Parameters<typeof deteksiDenganAturan>[0]> = {}) =>
  deteksiDenganAturan({ teks_terbaca: teks, ...ekstra }).map((t) => t.kode_tanda).sort();

describe('pecahSegmen', () => {
  it('memecah per kalimat dan baris tanpa memotong nominal atau singkatan', () => {
    expect(pecahSegmen('Gaji Rp3.000.000. Hubungi No. HP 0812\nKirim CV')).toEqual([
      'Gaji Rp3.000.000.',
      'Hubungi No. HP 0812',
      'Kirim CV',
    ]);
  });
});

describe('cariKutipanAsli', () => {
  const teks = 'Dicari Admin Toko Online.\nBiaya seragam Rp150.000 dibayar saat interview.\nDaftar via WhatsApp 0812-3456-7890.';

  it('menerima kutipan yang sama persis dan mengembalikan teks aslinya', () => {
    expect(cariKutipanAsli('biaya seragam rp150.000', teks)).toBe('Biaya seragam Rp150.000');
  });

  it('mengabaikan beda spasi dan tanda baca', () => {
    expect(cariKutipanAsli('Biaya seragam Rp 150.000,-', teks)).toBe('Biaya seragam Rp150.000');
    expect(cariKutipanAsli('"Daftar via WhatsApp"', teks)).toBe('Daftar via WhatsApp');
  });

  it('menerima kutipan yang sedikit dirapikan AI dan memakai kalimat aslinya', () => {
    expect(cariKutipanAsli('Biaya seragam dibayar ketika interview', teks)).toBe(
      'Biaya seragam Rp150.000 dibayar saat interview.'
    );
  });

  it('menolak kutipan yang tidak ada di poster', () => {
    expect(cariKutipanAsli('Wajib transfer deposit Rp500.000', teks)).toBeNull();
    expect(cariKutipanAsli('', teks)).toBeNull();
  });
});

describe('cariNominalRupiah', () => {
  it('membaca berbagai cara menulis nominal', () => {
    expect(nominalBulananTertinggi('Gaji Rp 8.000.000')).toBe(8_000_000);
    expect(nominalBulananTertinggi('Gaji 8 juta')).toBe(8_000_000);
    expect(nominalBulananTertinggi('Gaji 8,5 jt')).toBe(8_500_000);
    expect(nominalBulananTertinggi('Gaji Rp5.000.000 - Rp15.000.000')).toBe(15_000_000);
    expect(nominalBulananTertinggi('Gaji 5-15 juta')).toBe(15_000_000);
    expect(nominalBulananTertinggi('Gaji 5 s/d 7 juta')).toBe(7_000_000);
  });

  it('menyetarakan bayaran harian dan per jam ke per bulan', () => {
    const [harian] = cariNominalRupiah('Bayaran Rp300rb/hari');
    expect(harian).toMatchObject({ nilai: 300_000, satuan: 'hari', bulanan: 7_500_000 });
    expect(cariNominalRupiah('Rp50.000 per jam')[0]).toMatchObject({ satuan: 'jam', bulanan: 6_300_000 });
  });

  it('tidak membaca nomor HP, tahun, atau lama pengalaman sebagai uang', () => {
    expect(cariNominalRupiah('Hubungi 081234567890 tahun 2026, pengalaman 2 tahun')).toEqual([]);
  });
});

describe('deteksiDenganAturan: poster yang perlu diwaspadai', () => {
  it('poster contoh aplikasi: biaya seragam, gaji tinggi untuk admin, daftar via WhatsApp', () => {
    expect(
      kodeDari('Dicari Admin Toko Online. Gaji Rp8.000.000. Biaya seragam Rp150.000. Daftar via WhatsApp.', {
        posisi: 'Admin Toko Online',
      })
    ).toEqual(['biaya_di_awal', 'gaji_tidak_wajar', 'pesan_pribadi']);
  });

  it('kerja online dengan bayaran harian besar, tanpa pengalaman, lewat Telegram', () => {
    const teks =
      'LOWONGAN KERJA ONLINE\nKerja santai dari rumah, cukup modal HP.\nTanpa pengalaman, semua usia.\nPenghasilan Rp500.000/hari langsung cair!\nDaftar sekarang: t.me/kerjaonline88';
    expect(kodeDari(teks)).toEqual(['gaji_tidak_wajar', 'pesan_pribadi']);
  });

  it('meminta transfer biaya dan nomor rekening', () => {
    const teks =
      'Dibutuhkan Staff Gudang. Peserta wajib transfer biaya pendaftaran Rp250.000 ke rekening panitia. Kirimkan foto KTP dan nomor rekening ke WA 0812 3456 7890.';
    const hasil = kodeDari(teks);
    expect(hasil).toContain('biaya_di_awal');
    expect(hasil).toContain('data_sensitif');
    expect(hasil).toContain('pesan_pribadi');
  });

  it('menahan ijazah asli sebagai jaminan', () => {
    expect(kodeDari('Syarat: ijazah asli diserahkan sebagai jaminan selama kontrak.')).toEqual([
      'data_sensitif',
    ]);
  });

  it('email gratis dan tautan pendek', () => {
    const email = deteksiDenganAturan({ teks_terbaca: 'Kirim CV ke rekrutmen.ptmaju@gmail.com' });
    expect(email.map((t) => t.kode_tanda)).toEqual(['email_gratis']);
    expect(email[0].kutipan).toBe('rekrutmen.ptmaju@gmail.com');
    expect(email[0].penjelasan).toContain('gmail.com');

    expect(kodeDari('Isi formulir di bit.ly/loker-padang2026')).toEqual(['email_gratis']);
  });

  it('uang pendaftaran yang "dikembalikan jika tidak lolos" tetap dianggap biaya', () => {
    expect(kodeDari('Uang pendaftaran Rp100.000, jika tidak lolos uang dikembalikan.')).toEqual([
      'biaya_di_awal',
    ]);
  });
});

describe('deteksiDenganAturan: poster resmi tidak ditandai', () => {
  it('poster perusahaan dengan email domain sendiri dan pernyataan gratis', () => {
    const teks =
      'PT Contoh Jaya Abadi membuka lowongan Staff Akuntansi.\nKualifikasi: S1 Akuntansi, pengalaman minimal 2 tahun.\nGaji Rp9.000.000 per bulan.\nKirim lamaran ke rekrutmen@contohjaya.co.id\nInfo: WA 0812-3456-7890\nProses rekrutmen TIDAK DIPUNGUT BIAYA APAPUN.';
    expect(kodeDari(teks, { posisi: 'Staff Akuntansi' })).toEqual([]);
  });

  it('gaji ditransfer dan biaya ditanggung perusahaan bukan biaya dari pelamar', () => {
    const teks =
      'Dicari Kasir. Gaji dibayar Rp3.200.000 dan ditransfer ke rekening setiap bulan. Biaya pelatihan ditanggung perusahaan. Lamar lewat jobstreet.';
    expect(kodeDari(teks, { posisi: 'Kasir' })).toEqual([]);
  });

  it('gaji sesuai UMP untuk posisi umum tidak ditandai', () => {
    expect(
      kodeDari('Dicari Admin. Gaji Rp3.200.000. Kirim CV ke hrd@tokosukses.com', { posisi: 'Admin' })
    ).toEqual([]);
  });

  it('teks kosong tidak menghasilkan temuan', () => {
    expect(deteksiDenganAturan({ teks_terbaca: '   ' })).toEqual([]);
  });
});

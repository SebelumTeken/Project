import { describe, expect, it } from 'vitest';
import { analisisKeLowongan } from './validasi';
import { LowonganData } from '../types';

/**
 * Set poster uji dari pola lowongan palsu yang umum dan poster resmi pembanding.
 * Semua nama, nomor, dan alamat di sini rekaan. Temuan AI dianggap kosong,
 * jadi tes ini mengukur deteksi aturan saja (batas bawah kemampuan aplikasi).
 */
interface PosterUji {
  nama: string;
  posisi: string | null;
  teks: string;
  harapan: LowonganData['tingkat_perhatian'][];
}

const PALSU: PosterUji[] = [
  {
    nama: 'mencatut BUMN, Gmail, gaji tinggi untuk semua jurusan',
    posisi: 'Staff Administrasi',
    teks: `REKRUTMEN KARYAWAN PT PERTAMINA (PERSERO) 2026
Dibutuhkan segera: Staff Administrasi, Operator Produksi, Security, Driver
Kualifikasi: usia 18-45 tahun, pendidikan SMA/SMK/D3/S1 semua jurusan
Gaji Rp7.500.000 - Rp15.000.000, mess, BPJS
Kirim lamaran ke: rekrutmen.pertamina2026@gmail.com`,
    harapan: ['tinggi'],
  },
  {
    nama: 'mencatut Rekrutmen Bersama BUMN, hanya lewat WA',
    posisi: null,
    teks: `Rekrutmen Bersama BUMN 2026 telah dibuka!
Untuk lulusan D3/S1 semua jurusan.
Pendaftaran dan informasi hubungi Admin: 0813-9988-7766 (WA)
Batas pendaftaran 3 hari lagi, kuota terbatas!`,
    harapan: ['tinggi'],
  },
  {
    nama: 'mencatut bank, Gmail, wawancara di hotel dengan travel agent',
    posisi: 'Customer Service',
    teks: `PT BANK RAKYAT INDONESIA (PERSERO) Tbk membuka lowongan Customer Service dan Teller.
Pendidikan minimal D3.
Kirim berkas ke hrd.bri.recruitment@gmail.com paling lambat 2 hari.
Tes dan interview di Hotel Pangeran Beach Padang.
Akomodasi dan transportasi melalui travel agent yang ditunjuk panitia, biaya ditanggung peserta dan akan diganti setelah lolos.`,
    harapan: ['tinggi'],
  },
  {
    nama: 'mencatut minimarket, minta foto KTP lewat WA',
    posisi: 'Kasir',
    teks: `LOWONGAN KERJA INDOMARET 2026
Posisi: Kasir, Pramuniaga, Admin Gudang
Syarat: lulusan SMA/SMK sederajat, usia maksimal 30 tahun
Gaji UMR + tunjangan
Kirim CV dan foto KTP via WhatsApp: 0857-1234-5678
Kuota terbatas! Segera daftar`,
    harapan: ['tinggi'],
  },
  {
    nama: 'kerja online like dan follow dengan bayaran harian besar',
    posisi: null,
    teks: `DICARI FREELANCER ONLINE
Kerja dari rumah hanya dengan HP. Tugas: like dan follow akun Instagram toko.
Bayaran Rp50.000 per tugas, bisa Rp1.000.000/hari!
Tanpa pengalaman, tanpa modal.
Daftar: wa.me/6281234567890`,
    harapan: ['tinggi'],
  },
  {
    nama: 'United Tractors palsu: nama Tbk, tanpa kanal resmi, info sangat umum (poster nyata, terpotong)',
    posisi: null,
    teks: `UNITED TRACTORS member of ASTRA
LOWONGAN KERJA PT UNITED TRACTORS Tbk 2026
Bergabunglah bersama PT United Tractors Tbk, perusahaan alat berat terbesar di Indonesia, bagian dari Grup Astra yang bergerak di bidang alat berat, pertambangan, konstruksi, dan energi dengan jaringan operasional di seluruh Indonesia.
POSISI YANG BERPOTENSI DIBUKA
Administration Staff
Human Capital Staff
Finance & Accounting Staff
Management Trainee (MT)
Business Consultant
Mechanical Engineer
Electrical Engineer
Mining Engineer
Safety Officer (HSE)
IT Support / Programmer
Procurement Staff
Supply Chain Staff
Fresh Graduate Development Program
KUALIFIKASI UMUM
Pendidikan SMA/SMK, D3, S1 sesuai posisi
Usia minimal 18 tahun
Bersedia ditempatkan di seluruh Indonesia
Fresh Graduate dipersilakan melamar
BENEFIT
Gaji kompetitif
BPJS & Asuransi Kesehatan
Bonus dan insentif kinerja
Fasilitas mess untuk area tertentu`,
    harapan: ['tinggi'],
  },
];

const ASLI: PosterUji[] = [
  {
    nama: 'United Tractors asli: program bernama, tanggal jelas, situs resmi (poster nyata)',
    posisi: null,
    teks: `UNITED TRACTORS member of ASTRA
United Tractors is Hiring! Astra Internship Fair #4 2026
PT United Tractors Tbk offers internship opportunities for active undergraduate students.
Positions Available: Business Operations Intern, People Management Intern, Communication & Multimedia Intern
Requirements: Active university students from Semester 5 - 8. Minimum GPA of 3.25. Willing to do a full WFO arrangement.
Internship Period 3 August - 31 December 2026
Internship Placement Head Office PT United Tractors Tbk, Jakarta Timur
Registration Period 15 - 26 June 2026
Apply now by scaning the QR or visit our website! career.astra.co.id
career.unitedtractors.com | PT United Tractors Tbk | @unitedtractors.career`,
    harapan: ['rendah'],
  },
  {
    nama: 'perusahaan besar lewat portal resmi',
    posisi: 'Management Trainee',
    teks: `PT Semen Padang membuka kesempatan berkarier sebagai Management Trainee.
Kualifikasi: S1 Teknik Kimia/Mesin, IPK minimal 3,00, usia maksimal 26 tahun.
Pendaftaran online melalui https://rekrutmen.contohsemen.co.id
Seluruh proses rekrutmen tidak dipungut biaya.`,
    harapan: ['rendah'],
  },
  {
    nama: 'perusahaan terbuka dengan situs karier dan WA untuk info',
    posisi: 'Kasir',
    teks: `PT Contoh Ritel Tbk membuka lowongan Kasir untuk area Padang.
Syarat: SMA/SMK, usia maksimal 27 tahun.
Daftar di https://karier.contohritel.co.id
Info: WA 0812-1111-2222`,
    harapan: ['rendah'],
  },
  {
    nama: 'toko lokal, lamaran lewat WA atau antar langsung',
    posisi: 'Karyawati Toko',
    teks: `Dibutuhkan Karyawati Toko Baju Rumah Mode Padang.
Syarat: wanita, usia 18-25 tahun, jujur dan rajin.
Gaji Rp2.500.000 + bonus.
Lamaran antar langsung ke Jl. Permindo No. 12 Padang atau WA 0812-6677-8899.`,
    harapan: ['rendah'],
  },
  {
    nama: 'walk-in interview di hotel tanpa biaya',
    posisi: 'Staff Gudang',
    teks: `Walk-in Interview PT Contoh Logistik Sumbar
Posisi: Staff Gudang, pengalaman minimal 1 tahun.
Hari Sabtu di Hotel Pangeran Beach Padang, bawa CV dan fotokopi ijazah.
Tidak dipungut biaya apa pun.`,
    harapan: ['rendah'],
  },
  {
    nama: 'CV kecil memakai Gmail',
    posisi: 'Staff Admin',
    teks: `CV Maju Bersama membutuhkan Staff Admin.
Syarat: D3 Akuntansi, pengalaman minimal 1 tahun, menguasai Excel.
Gaji Rp3.300.000.
Kirim CV ke cvmajubersama.padang@gmail.com`,
    harapan: ['rendah', 'sedang'],
  },
];

function nilai(poster: PosterUji) {
  return analisisKeLowongan({
    teks_terbaca: poster.teks,
    nama_perusahaan: null,
    posisi: poster.posisi,
    lokasi: null,
    gaji_tertulis: null,
    kontak: null,
    ringkasan: '',
    temuan: [],
  }).data;
}

describe('set poster uji: lowongan palsu terdeteksi', () => {
  it.each(PALSU)('$nama', (poster) => {
    expect(poster.harapan).toContain(nilai(poster).tingkat_perhatian);
  });
});

describe('set poster uji: lowongan resmi tidak ditandai tinggi', () => {
  it.each(ASLI)('$nama', (poster) => {
    expect(poster.harapan).toContain(nilai(poster).tingkat_perhatian);
  });
});

describe('temuan AI yang keliru tidak mengubah hasil', () => {
  const analisisDenganTemuanAi = (
    poster: PosterUji,
    temuan: { kode_tanda: string; kutipan: string; penjelasan: string }[]
  ) =>
    analisisKeLowongan({
      teks_terbaca: poster.teks,
      nama_perusahaan: 'PT United Tractors Tbk',
      posisi: null,
      lokasi: null,
      gaji_tertulis: null,
      kontak: null,
      ringkasan: '',
      temuan,
    });

  it('poster asli tetap rendah walau AI menandai tanda yang tidak terbukti', () => {
    const asli = ASLI[0];
    const { data, diagnosis } = analisisDenganTemuanAi(asli, [
      { kode_tanda: 'info_terlalu_umum', kutipan: 'Positions Available', penjelasan: 'Umum.' },
      { kode_tanda: 'kanal_tidak_jelas', kutipan: 'United Tractors is Hiring', penjelasan: 'Tidak ada kanal.' },
      { kode_tanda: 'pesan_pribadi', kutipan: '@unitedtractors.career', penjelasan: 'Lewat DM.' },
    ]);
    expect(data.tingkat_perhatian).toBe('rendah');
    expect(diagnosis.dibuang.map((d) => d.alasan)).toEqual([
      'tidak terbukti dari teks poster',
      'tidak terbukti dari teks poster',
      'tidak terbukti dari teks poster',
    ]);
  });

  it('poster palsu tetap tinggi walau AI tidak menemukan apa pun', () => {
    const palsu = PALSU.find((p) => p.nama.startsWith('United Tractors palsu'))!;
    expect(analisisDenganTemuanAi(palsu, []).data.tingkat_perhatian).toBe('tinggi');
  });

  it('temuan biaya dari AI dibuang jika kutipannya menyatakan gratis', () => {
    const { data } = analisisKeLowongan({
      teks_terbaca: ASLI[1].teks + '\nProses rekrutmen tidak dipungut biaya.',
      nama_perusahaan: null,
      posisi: 'Kasir',
      lokasi: null,
      gaji_tertulis: null,
      kontak: null,
      ringkasan: '',
      temuan: [
        { kode_tanda: 'biaya_di_awal', kutipan: 'tidak dipungut biaya', penjelasan: 'Ada biaya.' },
      ],
    });
    expect(data.tingkat_perhatian).toBe('rendah');
  });

  it('temuan AI untuk biaya yang nyata tetap dipakai', () => {
    const { data } = analisisKeLowongan({
      teks_terbaca: 'Lowongan Admin. Peserta wajib membawa sumbangan pembinaan Rp300.000.',
      nama_perusahaan: null,
      posisi: 'Admin',
      lokasi: null,
      gaji_tertulis: null,
      kontak: null,
      ringkasan: '',
      temuan: [
        { kode_tanda: 'biaya_di_awal', kutipan: 'sumbangan pembinaan Rp300.000', penjelasan: 'Pelamar diminta membayar.' },
      ],
    });
    expect(data.temuan.map((t) => t.kode_tanda)).toContain('biaya_di_awal');
    expect(data.tingkat_perhatian).toBe('tinggi');
  });
});

describe('penjelasan nama perusahaan yang dicatut', () => {
  it('menyebut nama perusahaan dan kanal yang dipakai', () => {
    const data = nilai(PALSU[2]);
    const kontak = data.temuan.find((t) => t.kode_tanda === 'email_gratis');
    expect(kontak?.bobot).toBe('tinggi');
    expect(kontak?.penjelasan).toContain('BANK RAKYAT INDONESIA');
    expect(kontak?.penjelasan).toContain('email gratis');
  });

  it('menaikkan bobot temuan yang sudah ditemukan AI', () => {
    const { data } = analisisKeLowongan({
      teks_terbaca: PALSU[1].teks,
      nama_perusahaan: null,
      posisi: null,
      lokasi: null,
      gaji_tertulis: null,
      kontak: null,
      ringkasan: '',
      temuan: [{ kode_tanda: 'pesan_pribadi', kutipan: 'hubungi Admin', penjelasan: 'Lewat WA.' }],
    });
    expect(data.temuan).toHaveLength(1);
    expect(data.temuan[0]).toMatchObject({ kode_tanda: 'pesan_pribadi', bobot: 'tinggi' });
    expect(data.tingkat_perhatian).toBe('tinggi');
  });
});

export type AppMode = 'contoh' | 'ai';

export interface TemuanItem {
  id: string;
  kode_tanda: string;
  bobot: 'sedang' | 'tinggi';
  judul: string;
  kutipan: string;
  penjelasan: string;
}

export interface TandaBahayaItem {
  id: string;
  kode: string;
  label: string;
  bobot: 'sedang' | 'tinggi';
  sumber: string;
  saran_verifikasi: string;
}

export interface LowonganData {
  teks_terbaca: string;
  nama_perusahaan: string | null;
  posisi: string | null;
  lokasi: string | null;
  gaji_tertulis: number | null;
  kontak: string | null;
  tingkat_perhatian: 'rendah' | 'sedang' | 'tinggi';
  ringkasan: string;
  temuan: TemuanItem[];
  gambar_data?: string;
  /** Asal data: 'ai' jika hasil analisis Groq, selain itu dianggap data contoh. */
  sumber?: 'contoh' | 'ai';
  /** Nama file poster yang diunggah pengguna. */
  nama_file?: string;
}

export interface TawaranData {
  /** Nama posisi (opsional), dipakai untuk latihan negosiasi */
  posisi?: string | null;
  /** Nominal sesuai satuan status kerja: per bulan (penuh waktu/magang), per jam (paruh waktu), per hari (harian) */
  gaji_bulanan: number;
  jenis_pekerjaan: 'penuh_waktu' | 'paruh_waktu' | 'magang' | 'harian' | 'tidak_tahu';
  skala_usaha: 'mikro_kecil' | 'menengah_besar' | 'tidak_tahu';
  masa_kerja_kurang_1_tahun: boolean;
  /** Khusus harian: 6 hari (UMP ÷ 25) atau 5 hari (UMP ÷ 21) per minggu */
  hari_kerja_per_minggu?: 5 | 6;
  nominal_patokan: number;
  selisih_patokan: number;
  posisi_patokan: 'di_bawah' | 'setara' | 'di_atas' | 'perlu_dicek';
  pertanyaan?: string[];
}

export interface PesanLatihan {
  id: string;
  pengirim: 'pengguna' | 'hrd';
  isi: string;
}

export interface EvaluasiLatihan {
  skor_kejelasan: number;
  skor_alasan: number;
  skor_kesopanan: number;
  total_skor: number;
  maksimal_skor: number;
  masukan: string;
  contoh_kalimat: string;
}

export interface UpahMinimumItem {
  id: string;
  wilayah: string;
  tahun: number;
  nominal: number;
  sumber: string;
}


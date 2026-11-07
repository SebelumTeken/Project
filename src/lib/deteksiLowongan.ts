import { UMP_SUMBAR_2026 } from './upah';

/**
 * Deteksi tanda bahaya lowongan berbasis aturan.
 *
 * AI membaca teks poster dengan baik, tetapi penilaiannya tidak konsisten.
 * Karena itu tanda yang bisa dikenali dari kata atau angka diperiksa di kode,
 * lalu digabung dengan temuan AI. Semua kutipan yang dihasilkan di sini
 * selalu potongan asli dari teks poster.
 */

/* ───────────────────────── Pencocokan teks ───────────────────────── */

const HURUF_ANGKA = /[\p{L}\p{N}]/u;

interface PetaKompak {
  /** Teks tanpa spasi dan tanda baca, huruf kecil. */
  kompak: string;
  /** Posisi awal karakter asli untuk tiap karakter di `kompak`. */
  awal: number[];
  /** Posisi akhir (eksklusif) karakter asli untuk tiap karakter di `kompak`. */
  akhir: number[];
}

function petaKompak(teks: string): PetaKompak {
  let kompak = '';
  const awal: number[] = [];
  const akhir: number[] = [];
  let posisi = 0;

  for (const ch of teks) {
    for (const c of ch.normalize('NFKC').toLowerCase()) {
      if (!HURUF_ANGKA.test(c)) continue;
      kompak += c;
      for (let u = 0; u < c.length; u++) {
        awal.push(posisi);
        akhir.push(posisi + ch.length);
      }
    }
    posisi += ch.length;
  }

  return { kompak, awal, akhir };
}

const KATA_UMUM = new Set([
  'yang', 'dan', 'untuk', 'dengan', 'atau', 'dari', 'pada', 'ini', 'itu',
  'kami', 'anda', 'akan', 'dalam', 'bagi', 'kamu', 'para', 'juga', 'via',
]);

function kataPenting(teks: string): string[] {
  return teks
    .normalize('NFKC')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((kata) => kata.length >= 3 && !KATA_UMUM.has(kata));
}

/** Singkatan yang titiknya bukan akhir kalimat. */
const SINGKATAN = new Set([
  'no', 'jl', 'hp', 'telp', 'tlp', 'dll', 'dsb', 'pt', 'cv', 'tbk', 'ir', 'dr',
  'st', 'sh', 'se', 'kom', 'rek', 'ttd', 'rp', 'wa', 'kab', 'kec',
]);

/**
 * Memecah teks poster menjadi baris atau kalimat.
 * Setiap bagian adalah potongan asli dari teks (sudah di-trim).
 * Titik pada nominal seperti Rp3.000.000 tidak dianggap akhir kalimat.
 */
export function pecahSegmen(teks: string): string[] {
  const segmen: string[] = [];
  let mulai = 0;

  const simpan = (sampai: number) => {
    const potong = teks.slice(mulai, sampai).trim();
    if (potong) segmen.push(potong);
  };

  for (let i = 0; i < teks.length; i++) {
    const c = teks[i];
    if (c === '\n' || c === '•') {
      simpan(i);
      mulai = i + 1;
      continue;
    }
    if (/[.!?]/.test(c) && (i + 1 >= teks.length || /\s/.test(teks[i + 1]))) {
      const kataSebelum = teks.slice(mulai, i).match(/(\p{L}+)$/u)?.[1]?.toLowerCase();
      if (c === '.' && kataSebelum && SINGKATAN.has(kataSebelum)) continue;
      simpan(i + 1);
      mulai = i + 1;
    }
  }
  simpan(teks.length);

  return segmen;
}

/**
 * Mencari kutipan AI di teks poster dan mengembalikan potongan teks aslinya.
 *
 * 1. Sama persis (huruf besar/kecil diabaikan).
 * 2. Sama setelah spasi dan tanda baca diabaikan, misalnya "Rp 150.000" dan "Rp150.000".
 * 3. Minimal 75% kata penting kutipan ada di satu kalimat poster; kalimat itu yang dipakai.
 *
 * Mengembalikan null jika kutipan memang tidak ada di poster.
 */
export function cariKutipanAsli(kutipan: string, teks: string): string | null {
  const dicari = kutipan.trim();
  if (!dicari || !teks.trim()) return null;

  const indeks = teks.toLowerCase().indexOf(dicari.toLowerCase());
  if (indeks !== -1) return teks.slice(indeks, indeks + dicari.length);

  const kutipanKompak = petaKompak(dicari).kompak;
  if (kutipanKompak.length >= 4) {
    const peta = petaKompak(teks);
    const posisi = peta.kompak.indexOf(kutipanKompak);
    if (posisi !== -1) {
      return teks.slice(peta.awal[posisi], peta.akhir[posisi + kutipanKompak.length - 1]);
    }
  }

  const kataKutipan = kataPenting(dicari);
  if (kataKutipan.length >= 2) {
    let terbaik: string | null = null;
    let skorTerbaik = 0;
    for (const segmen of pecahSegmen(teks)) {
      const kataSegmen = new Set(kataPenting(segmen));
      const skor = kataKutipan.filter((kata) => kataSegmen.has(kata)).length / kataKutipan.length;
      if (skor > skorTerbaik) {
        skorTerbaik = skor;
        terbaik = segmen;
      }
    }
    if (terbaik && skorTerbaik >= 0.75) return terbaik;
  }

  return null;
}

/* ───────────────────────── Nominal rupiah ───────────────────────── */

export interface NominalDitemukan {
  /** Nilai tertinggi yang tertulis (batas atas jika berupa rentang). */
  nilai: number;
  /** Nilai yang disetarakan per bulan. */
  bulanan: number;
  satuan: 'bulan' | 'minggu' | 'hari' | 'jam';
  teks: string;
}

const POLA_ANGKA = String.raw`\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?`;
const POLA_NOMINAL = new RegExp(
  String.raw`(rp\.?\s*)?(${POLA_ANGKA})(?:\s*(?:-|–|s\.?\s?\/?\s?d\.?|sampai|hingga)\s*(?:rp\.?\s*)?(${POLA_ANGKA}))?\s*(juta|jt|ribu|rb|k)?(?![\p{L}\d])`,
  'giu'
);

function bacaAngka(teks: string): number {
  if (/^\d{1,3}(?:[.,]\d{3})+$/.test(teks)) return Number(teks.replace(/[.,]/g, ''));
  return Number(teks.replace(',', '.'));
}

const KALI_SATUAN: Record<string, number> = { juta: 1e6, jt: 1e6, ribu: 1e3, rb: 1e3, k: 1e3 };
const KALI_BULANAN: Record<NominalDitemukan['satuan'], number> = {
  bulan: 1,
  minggu: 4,
  hari: 25,
  jam: 126,
};

function satuanWaktu(sebelum: string, sesudah: string): NominalDitemukan['satuan'] {
  if (/^\s*(?:\/|per|se)\s*(?:hari|day)/i.test(sesudah) || /harian\s*$/i.test(sebelum)) return 'hari';
  if (/^\s*(?:\/|per|se)\s*(?:jam|hour)/i.test(sesudah)) return 'jam';
  if (/^\s*(?:\/|per|se)\s*(?:minggu|pekan|week)/i.test(sesudah) || /mingguan\s*$/i.test(sebelum)) {
    return 'minggu';
  }
  return 'bulan';
}

/** Mencari semua nominal rupiah dalam teks, misalnya "Rp8.000.000", "8 juta", "5-15 jt", "300rb/hari". */
export function cariNominalRupiah(teks: string): NominalDitemukan[] {
  const hasil: NominalDitemukan[] = [];
  for (const m of teks.matchAll(POLA_NOMINAL)) {
    const [cocok, rp, angka1, angka2, satuanAngka] = m;
    const kali = satuanAngka ? KALI_SATUAN[satuanAngka.toLowerCase()] : 1;
    const nilai = Math.max(bacaAngka(angka1), angka2 ? bacaAngka(angka2) : 0) * kali;

    // Tanpa "Rp" atau satuan, hanya angka berpemisah ribuan yang dianggap uang.
    // Ini menyaring "2 tahun", tahun "2026", dan nomor HP "081234567890".
    if (!rp && !satuanAngka && !/^[1-9]\d{0,2}(?:[.,]\d{3})+$/.test(angka1)) continue;
    if (!Number.isFinite(nilai) || nilai < 1_000) continue;

    const awal = m.index ?? 0;
    const satuan = satuanWaktu(
      teks.slice(Math.max(0, awal - 25), awal),
      teks.slice(awal + cocok.length, awal + cocok.length + 15)
    );
    hasil.push({ nilai, bulanan: nilai * KALI_BULANAN[satuan], satuan, teks: cocok.trim() });
  }
  return hasil;
}

/** Nominal tertinggi per bulan dalam teks, atau null. Dipakai untuk merapikan gaji_tertulis dari AI. */
export function nominalBulananTertinggi(teks: string): number | null {
  const daftar = cariNominalRupiah(teks);
  return daftar.length ? Math.max(...daftar.map((n) => n.bulanan)) : null;
}

/* ───────────────────────── Aturan tanda bahaya ───────────────────────── */

export interface TemuanAturan {
  kode_tanda: string;
  kutipan: string;
  penjelasan: string;
  /** Diisi jika konteks poster membuat tanda ini lebih berat dari bobot bawaannya. */
  bobot?: 'tinggi';
}

export interface InputDeteksi {
  teks_terbaca: string;
  nama_perusahaan?: string | null;
  kontak?: string | null;
  gaji_tertulis?: number | null;
  posisi?: string | null;
}

const BATAS_KUTIPAN = 160;

/** Kalimat poster sebagai kutipan; jika terlalu panjang, pakai bagian yang cocok saja. */
function kutipanDari(segmen: string, cocok: string): string {
  return segmen.length <= BATAS_KUTIPAN ? segmen : cocok.trim();
}

function cariDiSegmen(
  segmen: string[],
  pola: RegExp,
  kecuali?: RegExp
): { segmen: string; cocok: string } | null {
  for (const s of segmen) {
    if (kecuali?.test(s)) continue;
    const m = s.match(pola);
    if (m) return { segmen: s, cocok: m[0] };
  }
  return null;
}

const DOMAIN_GRATIS =
  /^(gmail|googlemail|yahoo|ymail|rocketmail|hotmail|outlook|live|msn|icloud|me|aol|protonmail|proton|mail|yandex|gmx|zoho)\./i;
const POLA_EMAIL = /[\w.+-]+\s?@\s?((?:[\w-]+\.)+[a-z]{2,})/gi;
const POLA_TAUTAN_PENDEK =
  /\b(?:bit\.ly|s\.id|tinyurl\.com|cutt\.ly|shorturl\.at|rebrand\.ly|t\.ly|is\.gd|ow\.ly|linktr\.ee)\/\S+/i;
const POLA_SITUS =
  /\b(?:https?:\/\/|www\.)\S+|\b[\w-]+\.(?:co\.id|go\.id|ac\.id|or\.id|com|id|net|org)(?:\/\S*)?(?![\w.])/i;
const POLA_PORTAL_KERJA =
  /\b(jobstreet|linkedin|glints|kalibrr|karir\.com|jobs\.id|indeed|karirhub|kemnaker|disnaker|loker\.id)\b/i;
const BUKAN_SITUS_RESMI =
  /\b(wa\.me|api\.whatsapp|t\.me|bit\.ly|s\.id|tinyurl|cutt\.ly|shorturl|rebrand\.ly|linktr\.ee|instagram\.com|facebook\.com|fb\.com|tiktok\.com)\b/i;

/** Lamaran diantar langsung ke alamat usaha, umum pada toko atau usaha lokal. */
const POLA_LAMAR_LANGSUNG =
  /\b(?:antar|datang|bawa|serahkan)\s+(?:lamaran\s+|berkas\s+|cv\s+)?langsung\b|\bwalk[\s-]?in\b|\blamaran\b.{0,40}?\b(?:jl|jln|jalan)\b\.?\s/i;

/**
 * Nama yang menandakan perusahaan besar: BUMN, perusahaan terbuka, bank, dan merek nasional
 * yang namanya sering dicatut lowongan palsu. Perusahaan seperti ini merekrut lewat situs
 * atau email resmi, bukan Gmail atau WhatsApp pribadi.
 */
const POLA_PERUSAHAAN_BESAR = new RegExp(
  [
    String.raw`\(\s*persero\s*\)|\bpersero\b|\btbk\b|\bbumn\b|\brekrutmen\s+bersama\b`,
    String.raw`\bbank\s+(?:rakyat\s+indonesia|negara\s+indonesia|mandiri|tabungan\s+negara|syariah\s+indonesia|central\s+asia|nagari)\b`,
    String.raw`\b(?:bri|bni|btn|bsi|bca)\b`,
    String.raw`\b(?:pertamina|pln|telkom|telkomsel|pelindo|pegadaian|jasa\s+marga|angkasa\s+pura|garuda\s+indonesia|kereta\s+api\s+indonesia|semen\s+padang|semen\s+indonesia|pupuk\s+indonesia|indomaret|alfamart|alfamidi|astra|unilever|indofood|sampoerna|gudang\s+garam|djarum|gojek|tokopedia|shopee)\b`,
  ].join('|'),
  'i'
);

/** Nama badan usaha lengkap, misalnya "PT United Tractors Tbk" atau "PT Pertamina (Persero)". */
const POLA_NAMA_PT =
  /\bPT\.?\s+[\p{L}\d&.'\- ]{2,60}?(?:\s*\(\s*persero\s*\))?(?:\s+tbk)?(?=\s*(?:[,.\n]|$|membuka|adalah|offers|is\b|\d{4}))/iu;

/** Ada kanal resmi: email domain perusahaan, situs, portal lowongan, atau (jika diizinkan) lamaran langsung ke alamat. */
function adaKanalResmi(teks: string, izinkanLamarLangsung = true): boolean {
  for (const m of teks.matchAll(POLA_EMAIL)) {
    if (!DOMAIN_GRATIS.test(m[1])) return true;
  }
  if (POLA_PORTAL_KERJA.test(teks)) return true;
  if (izinkanLamarLangsung && POLA_LAMAR_LANGSUNG.test(teks)) return true;

  const tanpaEmail = teks.replace(POLA_EMAIL, ' ');
  const situs = tanpaEmail.match(POLA_SITUS);
  return !!situs && !BUKAN_SITUS_RESMI.test(situs[0]);
}

/* biaya_di_awal */
const POLA_BIAYA = new RegExp(
  [
    String.raw`\b(?:biaya|uang|dana|ongkos)\s+(?:pendaftaran|administrasi|admin|seragam|pelatihan|training|diklat|medical|medis|tes|test|psikotes|akomodasi|transport(?:asi)?|pembuatan|pengurusan|jaminan|deposit|materai|meterai|registrasi|kartu|id\s?card|kontrak|asuransi|interview|wawancara|pemberkasan|proses|keanggotaan|member)\b`,
    String.raw`\b(?:transfer|tf|setor(?:an)?|bayar|membayar)\b.{0,40}?(?:rp\.?\s?\d|\d+[.,]?\d*\s?(?:rb|ribu|jt|juta|k)\b|rekening|dulu|terlebih\s+dahulu|di\s?muka)`,
    String.raw`\b(?:dp|down\s?payment|uang\s+muka)\b`,
    String.raw`\b(?:beli|membeli|pembelian)\s+(?:seragam|starter\s?kit|paket|produk|modul|kartu|voucher)\b`,
    String.raw`\btop[\s-]?up\b`,
    String.raw`\bdeposit\b`,
  ].join('|'),
  'i'
);
/** Pernyataan bahwa rekrutmen gratis, misalnya "Tidak dipungut biaya apa pun". */
const NEGASI_BIAYA = new RegExp(
  [
    String.raw`\b(?:tanpa|bebas|gratis|free)\s+(?:biaya|pungutan|dipungut|bayar|charge|fee)`,
    String.raw`\b(?:tidak|tak|tdk)\s+(?:ada\s+)?(?:dipungut|dikenakan|memungut|meminta|menarik|ada)\b.{0,20}?\b(?:biaya|bayar(?:an)?|uang|pungutan|fee)`,
    String.raw`\b(?:biaya|pungutan)\b.{0,20}\b(?:gratis|free|nol)\b`,
    // Hanya "ditanggung perusahaan"; "ditanggung peserta" justru biaya dari pelamar.
    String.raw`\b(?:ditanggung|dibayar(?:kan)?)\s+(?:oleh\s+)?(?:pihak\s+)?perusahaan`,
    String.raw`\b(?:seragam|pelatihan|training|mess|makan|akomodasi)\s+(?:gratis|free|disediakan|ditanggung)`,
  ].join('|'),
  'i'
);
const KONTEKS_GAJI = /\b(?:gaji|upah|salary|honor|komisi|bonus|insentif|penghasilan|pendapatan|thp)\b/i;

/**
 * Pola rekrutmen palsu yang mengatasnamakan perusahaan besar: pelamar diarahkan ke travel agent
 * tertentu atau menanggung tiket dan akomodasi sendiri, dengan janji diganti setelah lolos.
 */
const POLA_PROSES_JANGGAL = new RegExp(
  [
    String.raw`\b(?:travel(?:\s+agent)?|agen\s+perjalanan|biro\s+perjalanan)\b.{0,50}?\b(?:ditunjuk|panitia|rekanan|ditentukan|resmi\s+kami)\b`,
    String.raw`\b(?:tiket|akomodasi|penginapan|hotel|transportasi|transport)\b.{0,60}?\b(?:ditanggung|dibayar|biaya)\s+(?:oleh\s+)?(?:peserta|pelamar|kandidat|sendiri)\b`,
    String.raw`\b(?:biaya|tiket|ongkos)\b.{0,40}?\b(?:akan\s+)?(?:diganti|dikembalikan|direimburse|reimburse)\b`,
    String.raw`\b(?:booking|pesan|reservasi)\s+(?:tiket|kamar|hotel)\b`,
  ].join('|'),
  'i'
);

function cekProsesJanggal(segmen: string[]): TemuanAturan | null {
  const hit = cariDiSegmen(segmen, POLA_PROSES_JANGGAL);
  if (!hit) return null;
  return {
    kode_tanda: 'biaya_di_awal',
    kutipan: kutipanDari(hit.segmen, hit.cocok),
    penjelasan:
      'Pelamar diminta menanggung tiket atau akomodasi, atau diarahkan ke travel agent tertentu. Ini pola umum rekrutmen palsu. Jangan memesan atau membayar apa pun sebelum memastikan undangan lewat kanal resmi perusahaan.',
  };
}

function cekBiaya(segmen: string[]): TemuanAturan | null {
  for (const s of segmen) {
    if (NEGASI_BIAYA.test(s)) continue;
    const m = s.match(POLA_BIAYA);
    if (!m) continue;
    // "Gaji dibayar Rp4.000.000" bukan biaya dari pelamar.
    if (/^(?:transfer|tf|setor|bayar|membayar)/i.test(m[0]) && KONTEKS_GAJI.test(s)) continue;
    return {
      kode_tanda: 'biaya_di_awal',
      kutipan: kutipanDari(s, m[0]),
      penjelasan:
        'Poster menyebut pembayaran dari pelamar. Perusahaan resmi umumnya tidak memungut biaya rekrutmen. Jangan transfer apa pun sebelum perusahaan terverifikasi.',
    };
  }
  return null;
}

/* data_sensitif */
const POLA_DATA_SENSITIF = new RegExp(
  [
    String.raw`\b(?:kirim(?:kan)?|cantumkan|lampirkan|sertakan|serahkan|foto(?:kan)?|screenshot|ss|isi(?:kan)?|berikan)\b.{0,40}?\b(?:no(?:mor)?\.?\s?rek(?:ening)?|rekening|buku\s+tabungan|kartu\s+atm|pin|kode\s+otp|otp|kata\s+sandi|password|nama\s+ibu\s+kandung)\b`,
    String.raw`\b(?:kode\s+otp|otp)\b`,
    String.raw`\bpin\s+(?:atm|m-?banking|bank)\b`,
    String.raw`\bselfie\b.{0,25}\bktp\b`,
    String.raw`\b(?:ijazah|ktp|paspor|passport|bpkb|sertifikat)\s+asli\b.{0,40}?\b(?:ditahan|diserahkan|dititipkan|disimpan|jaminan)\b`,
    String.raw`\b(?:jaminan|ditahan|dititipkan|menahan)\b.{0,25}\b(?:ijazah|ktp|paspor|passport|bpkb)\b`,
    String.raw`\bnama\s+ibu\s+kandung\b`,
  ].join('|'),
  'i'
);
const POLA_KTP_LEWAT_CHAT =
  /\b(?:foto|scan|kirim(?:kan)?)\b.{0,30}\b(?:ktp|kk|kartu\s+keluarga)\b.{0,40}\b(?:wa|whats\s?app|telegram|dm|inbox)\b/i;

function cekDataSensitif(segmen: string[]): TemuanAturan | null {
  const hit = cariDiSegmen(segmen, POLA_DATA_SENSITIF) ?? cariDiSegmen(segmen, POLA_KTP_LEWAT_CHAT);
  if (!hit) return null;
  return {
    kode_tanda: 'data_sensitif',
    kutipan: kutipanDari(hit.segmen, hit.cocok),
    penjelasan:
      'Poster meminta data atau dokumen sensitif sejak awal. Jangan kirim nomor rekening, OTP, PIN, atau dokumen asli sebelum identitas perusahaan jelas.',
  };
}

/* pesan_pribadi */
const POLA_CHAT_PRIBADI =
  /\b(?:wa\.me\/\S+|t\.me\/\S+|whats\s?app|wa|w\.a|telegram|tele|dm|direct\s+message|inbox)\b|(?:\+62|\b08)\d[\d\s-]{7,13}\d/i;
const POLA_KONTEKS_MELAMAR =
  /\b(?:daftar|mendaftar|pendaftaran|lamar|lamaran|melamar|kirim|kirimkan|hubungi|chat|info|informasi|cv|berkas|minat|berminat|contact|cp|call|telp|telepon|interview|wawancara)\b/i;

function cekPesanPribadi(
  segmen: string[],
  teks: string,
  kontak: string,
  namaBesar: boolean
): TemuanAturan | null {
  // Lamaran langsung ke alamat wajar untuk usaha lokal, tetapi bukan untuk perusahaan besar.
  if (adaKanalResmi(`${teks}\n${kontak}`, !namaBesar)) return null;

  const hit =
    segmen
      .filter((s) => POLA_CHAT_PRIBADI.test(s) && POLA_KONTEKS_MELAMAR.test(s))
      .map((s) => ({ segmen: s, cocok: s.match(POLA_CHAT_PRIBADI)![0] }))[0] ??
    cariDiSegmen(segmen, POLA_CHAT_PRIBADI);
  if (!hit) return null;

  return {
    kode_tanda: 'pesan_pribadi',
    kutipan: kutipanDari(hit.segmen, hit.cocok),
    penjelasan:
      'Pendaftaran hanya lewat chat atau nomor pribadi, tanpa email domain perusahaan atau situs resmi. Cek kebenaran perusahaan lewat situs atau media sosial resminya.',
  };
}

/* email_gratis */
function cekKontakTidakResmi(teks: string): TemuanAturan | null {
  for (const m of teks.matchAll(POLA_EMAIL)) {
    if (DOMAIN_GRATIS.test(m[1])) {
      return {
        kode_tanda: 'email_gratis',
        kutipan: m[0],
        penjelasan: `Email kontak memakai layanan gratis (${m[1].toLowerCase()}), bukan domain perusahaan. Pastikan alamat ini tercantum di situs resmi perusahaan.`,
      };
    }
  }
  const pendek = teks.match(POLA_TAUTAN_PENDEK);
  if (pendek) {
    return {
      kode_tanda: 'email_gratis',
      kutipan: pendek[0],
      penjelasan:
        'Tautan pendek menyembunyikan alamat tujuan. Buka situs resmi perusahaan secara langsung, jangan lewat tautan ini.',
    };
  }
  return null;
}

/* gaji_tidak_wajar */
const POLA_SYARAT_MUDAH = new RegExp(
  [
    String.raw`\btanpa\s+(?:pengalaman|ijazah|syarat|modal|tes|test|interview|wawancara|keahlian|skill)`,
    String.raw`\btidak\s+(?:perlu|butuh|wajib|harus)\s+(?:pengalaman|ijazah|keahlian|skill|modal)`,
    String.raw`\bsemua\s+(?:jurusan|usia|umur|kalangan|lulusan)`,
    String.raw`\blulusan\s+(?:sd|smp)\b`,
    String.raw`\b(?:ibu\s+rumah\s+tangga|irt)\b`,
    String.raw`\bkerja\s+(?:dari\s+rumah|santai|online|sampingan|mudah|ringan)`,
    String.raw`\b(?:work\s+from\s+home|wfh)\b`,
    String.raw`\b(?:hanya|cukup|modal)\s+(?:dengan\s+)?(?:hp|handphone|smartphone|android)\b`,
    String.raw`\blangsung\s+(?:kerja|diterima|gajian|cair)\b`,
    String.raw`\b(?:like|follow|subscribe)\b.{0,15}\b(?:subscribe|like|follow|video|postingan)\b`,
    String.raw`\b(?:rating|review)\s+(?:produk|toko|hotel|aplikasi)\b`,
  ].join('|'),
  'i'
);
const POLA_POSISI_UMUM =
  /\b(?:admin|administrasi|staf|staff|operator|kasir|pramuniaga|spg|spb|packing|packer|helper|customer\s+service|cs|driver|sopir|kurir|office\s+boy|ob|security|satpam|pelayan|waiter|waitress|barista|cleaning|crew|data\s+entry|input\s+data|asisten|reseller|dropshipper|freelance|part[\s-]?time|paruh\s+waktu)\b/i;
/** Syarat yang menunjukkan posisi butuh kualifikasi, sehingga gaji tinggi masih masuk akal. */
const POLA_SYARAT_JELAS =
  /\b(?:pengalaman\s+(?:kerja\s+)?(?:min(?:imal)?\.?\s*)?\d|min(?:imal)?\.?\s*\d+\s*tahun|\d+\s*tahun\s+pengalaman|s1|s2|d3|d4|sarjana|diploma|sertifikasi|bersertifikat|menguasai)\b/i;
const KATA_GAJI =
  /\b(?:gaji|upah|salary|honor|komisi|bonus|insentif|penghasilan|pendapatan|income|bayaran|fee|thp|take\s+home\s+pay|cuan|profit)\b/i;

function formatRupiah(nilai: number): string {
  return `Rp${Math.round(nilai).toLocaleString('id-ID')}`;
}

function cekGajiTidakWajar(
  segmen: string[],
  teks: string,
  posisi: string,
  gajiAi: number | null
): TemuanAturan | null {
  // Gaji dari teks poster (hanya kalimat yang menyebut gaji atau bayaran).
  let terbaik: { segmen: string; bulanan: number } | null = null;
  for (const s of segmen) {
    if (!KATA_GAJI.test(s)) continue;
    for (const n of cariNominalRupiah(s)) {
      if (!terbaik || n.bulanan > terbaik.bulanan) terbaik = { segmen: s, bulanan: n.bulanan };
    }
  }

  let bulanan = terbaik?.bulanan ?? 0;
  let kutipan = terbaik?.segmen ?? null;
  if (gajiAi && gajiAi > bulanan) {
    bulanan = gajiAi;
    kutipan = kutipan ?? segmen.find((s) => KATA_GAJI.test(s)) ?? null;
  }
  if (!kutipan || bulanan <= 0) return null;

  const syaratMudah = POLA_SYARAT_MUDAH.test(teks);
  const syaratJelas = POLA_SYARAT_JELAS.test(teks);
  const posisiUmum = posisi.trim() ? POLA_POSISI_UMUM.test(posisi) : POLA_POSISI_UMUM.test(teks);
  const kaliUmp = bulanan / UMP_SUMBAR_2026;

  const mencurigakan =
    (syaratMudah && kaliUmp >= 2) ||
    (!syaratJelas && posisiUmum && kaliUmp >= 2.5) ||
    (!syaratJelas && kaliUmp >= 10);
  if (!mencurigakan) return null;

  return {
    kode_tanda: 'gaji_tidak_wajar',
    kutipan: kutipanDari(kutipan, kutipan.slice(0, BATAS_KUTIPAN)),
    penjelasan: `Gaji sekitar ${formatRupiah(bulanan)} per bulan, ${kaliUmp.toFixed(1).replace('.', ',')} kali UMP Sumatera Barat (${formatRupiah(UMP_SUMBAR_2026)})${
      syaratMudah ? ', dengan syarat yang sangat ringan' : ' untuk posisi umum'
    }. Tanyakan rincian tugas dan dasar perhitungan gajinya.`,
  };
}

/* kanal_tidak_jelas: poster tidak memberi cara melamar atau menghubungi sama sekali */
const POLA_ADA_KONTAK = new RegExp(
  [
    String.raw`[\w.+-]+\s?@\s?(?:[\w-]+\.)+[a-z]{2,}`,
    String.raw`\b(?:https?:\/\/|www\.)\S+`,
    String.raw`\b[\w-]+\.(?:co\.id|go\.id|ac\.id|or\.id|my\.id|com|id|net|org)\b`,
    String.raw`\b[\w-]+\.[a-z]{2,}\/\S+`,
    String.raw`(?:\+62|\b0)8\d[\d\s-]{6,}`,
    String.raw`\b(?:wa|whats\s?app|telegram|dm|inbox|telp|telepon|hubungi|contact)\b`,
    String.raw`\b(?:qr|barcode|scan)\b`,
    String.raw`\b(?:jl|jln|jalan)\b\.?\s+\p{L}`,
    String.raw`\b(?:antar|datang|bawa)\s+(?:lamaran\s+)?langsung\b|\bwalk[\s-]?in\b`,
    String.raw`@[\w.]{3,}`,
  ].join('|'),
  'iu'
);

/** Teks berupa iklan lowongan (bukan potongan kalimat lepas). */
const POLA_IKLAN_KERJA =
  /\b(?:lowongan|loker|rekrutmen|recruitment|dibutuhkan|dicari|membutuhkan|hiring|vacancy|posisi|position|karier|karir|career|bergabung|join)\b/i;

function cekKanalTidakJelas(segmen: string[], teks: string, namaBesar: string | null): TemuanAturan | null {
  if (!POLA_IKLAN_KERJA.test(teks)) return null;
  if (POLA_ADA_KONTAK.test(teks) || POLA_PORTAL_KERJA.test(teks)) return null;
  const kutipan = segmen.find((s) => POLA_IKLAN_KERJA.test(s)) ?? segmen[0];
  if (!kutipan) return null;
  return {
    kode_tanda: 'kanal_tidak_jelas',
    kutipan: kutipanDari(kutipan, kutipan.slice(0, BATAS_KUTIPAN)),
    penjelasan: `Poster${namaBesar ? ` memakai nama "${namaBesar}" tetapi` : ''} tidak mencantumkan situs, email, atau cara melamar resmi yang bisa dicek. Jika poster terpotong, minta versi lengkapnya, lalu cocokkan dengan situs karier resmi perusahaan.`,
  };
}

/* info_terlalu_umum: banyak ciri lowongan "massal" yang tidak spesifik */
const NAMA_BULAN =
  'jan(?:uari)?|feb(?:ruari)?|mar(?:et)?|apr(?:il)?|mei|may|jun[ie]?|jul[iy]?|agu(?:stus)?|aug(?:ust)?|sep(?:tember)?|okt(?:ober)?|oct(?:ober)?|nov(?:ember)?|des(?:ember)?|dec(?:ember)?';
const POLA_TANGGAL = new RegExp(
  String.raw`\b\d{1,2}\s*(?:-\s*\d{1,2}\s*)?(?:${NAMA_BULAN})\b|\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b|\b(?:batas|paling\s+lambat|deadline|ditutup|periode\s+pendaftaran|registration\s+period)\b`,
  'i'
);
const POLA_JUDUL_POSISI =
  /\b(?:staff?|engineer|officer|manager|admin(?:istrasi|istration)?|operator|trainee|programmer|consultant|driver|security|kasir|sales|teknisi|technician|supervisor|analyst|intern|helper|mekanik|mechanic|accounting|marketing|designer|developer|auditor|cs|customer\s+service)\b/gi;
const CIRI_UMUM: { pola: RegExp; nama: string }[] = [
  {
    pola: /\b(?:gaji|salary|penghasilan|upah)\s*[:\-–]?\s*(?:yang\s+)?(?:kompetitif|menarik|besar|tinggi|fantastis|competitive|attractive)\b|\b(?:competitive|attractive)\s+(?:salary|compensation)\b/i,
    nama: 'gaji tidak disebut angkanya',
  },
  { pola: /\b(?:sma|smk|slta)\b.{0,25}\b(?:d3|s1|diploma|sarjana)\b|\bsemua\s+(?:jurusan|lulusan)\b/i, nama: 'syarat pendidikan sangat luas' },
  { pola: /\b(?:seluruh|semua)\s+(?:wilayah\s+)?indonesia\b|\bberpotensi\s+dibuka\b|\bsesuai\s+posisi\b/i, nama: 'penempatan atau posisi tidak pasti' },
];

function cekInfoTerlaluUmum(segmen: string[], teks: string): TemuanAturan | null {
  const ciri: string[] = [];
  let kutipan: string | null = null;

  if (!POLA_TANGGAL.test(teks)) ciri.push('tidak ada tanggal pendaftaran');
  const jumlahPosisi = teks.match(POLA_JUDUL_POSISI)?.length ?? 0;
  if (jumlahPosisi >= 8) ciri.push('banyak posisi lintas bidang sekaligus');

  for (const { pola, nama } of CIRI_UMUM) {
    const s = segmen.find((x) => pola.test(x));
    if (s) {
      ciri.push(nama);
      kutipan = kutipan ?? s;
    }
  }

  if (ciri.length < 3 || !kutipan) return null;
  return {
    kode_tanda: 'info_terlalu_umum',
    kutipan: kutipanDari(kutipan, kutipan.slice(0, BATAS_KUTIPAN)),
    penjelasan: `Informasi lowongan sangat umum (${ciri.join(', ')}). Lowongan resmi biasanya menyebut posisi, syarat, tanggal, dan penempatan yang spesifik.`,
  };
}

/**
 * Tanda yang bisa dipastikan langsung dari teks poster. Untuk kode ini aturan yang memutuskan:
 * temuan AI hanya dipakai jika aturan juga menemukannya, supaya AI tidak salah menandai
 * poster resmi (misalnya menganggap poster dengan situs karier "tidak punya kanal resmi").
 */
export const KODE_DIPASTIKAN_ATURAN = new Set([
  'gaji_tidak_wajar',
  'pesan_pribadi',
  'email_gratis',
  'kanal_tidak_jelas',
  'info_terlalu_umum',
]);

/**
 * Memeriksa temuan AI yang tidak dipastikan aturan (biaya, data sensitif, atau kode baru).
 * Mengembalikan alasan penolakan, atau null jika temuan boleh dipakai.
 */
export function alasanTolakTemuanAi(kode: string, kutipan: string): string | null {
  if (kode === 'biaya_di_awal' && NEGASI_BIAYA.test(kutipan)) {
    return 'kutipan justru menyatakan tidak ada biaya';
  }
  return null;
}

/**
 * Menjalankan semua aturan pada hasil baca poster.
 * Hanya mengembalikan kode yang ada di tanda-bahaya.json; kode lain diabaikan oleh pemanggil.
 */
export function deteksiDenganAturan(input: InputDeteksi): TemuanAturan[] {
  const teks = input.teks_terbaca ?? '';
  if (!teks.trim()) return [];

  const segmen = pecahSegmen(teks);
  const kontak = input.kontak ?? '';
  const namaPerusahaan = input.nama_perusahaan?.trim() ?? '';
  const cocokBesar =
    namaPerusahaan.match(POLA_PERUSAHAAN_BESAR)?.[0] ?? teks.match(POLA_PERUSAHAAN_BESAR)?.[0];
  // Untuk penjelasan, pakai nama lengkap perusahaan jika tersedia (misalnya "PT United Tractors Tbk").
  const namaBesar = cocokBesar
    ? namaPerusahaan || teks.match(POLA_NAMA_PT)?.[0]?.trim() || cocokBesar.trim()
    : null;

  const temuan = [
    cekBiaya(segmen) ?? cekProsesJanggal(segmen),
    cekDataSensitif(segmen),
    cekGajiTidakWajar(segmen, teks, input.posisi ?? '', input.gaji_tertulis ?? null),
    cekPesanPribadi(segmen, teks, kontak, !!namaBesar),
    cekKontakTidakResmi(teks),
    cekKanalTidakJelas(segmen, teks, namaBesar),
    cekInfoTerlaluUmum(segmen, teks),
  ].filter((item): item is TemuanAturan => item !== null);

  return namaBesar ? tandaiNamaDicatut(temuan, namaBesar) : temuan;
}

/**
 * Poster memakai nama perusahaan besar tetapi kontaknya Gmail atau chat pribadi:
 * pola paling umum lowongan palsu. Tanda kontak dinaikkan menjadi bobot tinggi.
 */
function tandaiNamaDicatut(temuan: TemuanAturan[], namaBesar: string): TemuanAturan[] {
  const terlaluUmum = temuan.some((item) => item.kode_tanda === 'info_terlalu_umum');
  return temuan.map((item) => {
    // Nama besar + tanpa kanal resmi + info sangat umum: pola poster catut yang "rapi".
    if (item.kode_tanda === 'kanal_tidak_jelas') {
      return terlaluUmum ? { ...item, bobot: 'tinggi' } : item;
    }
    if (item.kode_tanda !== 'email_gratis' && item.kode_tanda !== 'pesan_pribadi') return item;
    const kanal = item.kode_tanda === 'email_gratis' ? 'email gratis' : 'chat atau nomor pribadi';
    return {
      ...item,
      bobot: 'tinggi',
      penjelasan: `Poster memakai nama "${namaBesar}", tetapi lamaran lewat ${kanal}. Perusahaan sebesar ini merekrut lewat situs atau email resminya, jadi ini pola umum lowongan yang mencatut nama perusahaan. Cek langsung di situs karier resminya.`,
    };
  });
}

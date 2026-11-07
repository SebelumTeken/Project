import type { EvaluasiLatihan, LowonganData, PesanLatihan, TawaranData } from '../types';
import { hitungPatokanUpah, LABEL_SATUAN, PosisiPatokan, SatuanUpah } from './upah';

/* ───────────────────────── Konteks ───────────────────────── */

export interface KonteksLatihan {
  posisi: string;
  perusahaan: string | null;
  /** Nominal tawaran dalam satuan status kerja */
  gaji: number;
  /** Patokan UMP dalam satuan yang sama dengan gaji */
  ump: number;
  satuan: SatuanUpah;
  /** "per bulan" / "per jam" / "per hari" */
  labelSatuan: string;
  /** Mis. "UMP Sumatera Barat 2026" atau "UMP Sumatera Barat 2026 ÷ 126 (upah per jam)" */
  namaPatokan: string;
  /** UMP wajib berlaku (usaha menengah/besar, bukan magang) */
  wajibUmp: boolean;
  /** Tawaran di bawah UMP padahal UMP wajib berlaku */
  diBawahWajib: boolean;
  selisih: number;
  posisiPatokan: PosisiPatokan;
  labelPosisi: string;
  jenisLabel: string;
  skalaLabel: string;
  masaKerjaLabel: string;
  /** Pertanyaan dari halaman hasil tawaran */
  pertanyaan: string[];
  /** Judul temuan dari Cek Lowongan (jika ada) */
  temuan: string[];
  /** Batas maksimal yang bisa diberikan HRD simulasi */
  batasNaik: number;
}

const LABEL_JENIS: Record<TawaranData['jenis_pekerjaan'], string> = {
  penuh_waktu: 'Penuh waktu',
  paruh_waktu: 'Paruh waktu',
  magang: 'Magang',
  harian: 'Harian',
  tidak_tahu: 'Belum diketahui',
};

const LABEL_SKALA: Record<TawaranData['skala_usaha'], string> = {
  menengah_besar: 'Usaha menengah/besar',
  mikro_kecil: 'Usaha mikro/kecil',
  tidak_tahu: 'Belum diketahui',
};

export const rupiah = (n: number) => `Rp${Math.round(n).toLocaleString('id-ID')}`;

/** Pembulatan wajar sesuai satuan: bulanan ke Rp50.000, harian ke Rp5.000, per jam ke Rp500. */
const bulatkan = (n: number, satuan: SatuanUpah) => {
  const langkah = satuan === 'bulan' ? 50000 : satuan === 'hari' ? 5000 : 500;
  return Math.round(n / langkah) * langkah;
};

export function buatKonteksLatihan(
  lowongan: LowonganData | null,
  tawaran: TawaranData
): KonteksLatihan {
  const hasil = hitungPatokanUpah({
    gajiBulanan: tawaran.gaji_bulanan,
    jenisPekerjaan: tawaran.jenis_pekerjaan,
    skalaUsaha: tawaran.skala_usaha,
    masaKerjaKurang1Tahun: tawaran.masa_kerja_kurang_1_tahun,
    hariKerjaPerMinggu: tawaran.hari_kerja_per_minggu,
  });

  const gaji = tawaran.gaji_bulanan;
  const diBawahWajib = hasil.wajibUmp && gaji < hasil.nominalPatokan;
  // HRD simulasi bisa naik ±10%, dan minimal sampai patokan UMP jika UMP wajib dan tawaran di bawahnya
  const batasNaik = Math.max(
    bulatkan(gaji * 1.1, hasil.satuan),
    diBawahWajib ? hasil.nominalPatokan : 0
  );

  return {
    posisi: tawaran.posisi?.trim() || lowongan?.posisi?.trim() || 'posisi yang dilamar',
    perusahaan: lowongan?.nama_perusahaan?.trim() || null,
    gaji,
    ump: hasil.nominalPatokan,
    satuan: hasil.satuan,
    labelSatuan: LABEL_SATUAN[hasil.satuan],
    namaPatokan: hasil.pembagi ? `patokan UMP ${LABEL_SATUAN[hasil.satuan]}` : 'UMP Sumatera Barat 2026',
    wajibUmp: hasil.wajibUmp,
    diBawahWajib,
    selisih: hasil.selisih,
    posisiPatokan: hasil.posisi,
    labelPosisi: hasil.labelPosisi,
    jenisLabel: LABEL_JENIS[tawaran.jenis_pekerjaan],
    skalaLabel: LABEL_SKALA[tawaran.skala_usaha],
    masaKerjaLabel: tawaran.masa_kerja_kurang_1_tahun ? 'Kurang dari 1 tahun' : '1 tahun atau lebih',
    pertanyaan: tawaran.pertanyaan ?? [],
    temuan: (lowongan?.temuan ?? []).map((t) => t.judul),
    batasNaik,
  };
}

export function buatPembuka(ctx: KonteksLatihan): PesanLatihan {
  const posisi = ctx.posisi === 'posisi yang dilamar' ? 'posisi ini' : `posisi ${ctx.posisi}`;
  return {
    id: 'hrd-pembuka',
    pengirim: 'hrd',
    isi: `Terima kasih sudah mengikuti proses seleksi untuk ${posisi}. Kami menawarkan ${ctx.jenisLabel === 'Magang' ? 'uang saku' : ctx.satuan === 'bulan' ? 'gaji' : 'upah'} ${rupiah(ctx.gaji)} ${ctx.labelSatuan}. Bagaimana tanggapanmu?`,
  };
}

/* ───────────────────────── Analisis teks pengguna ───────────────────────── */

const RE_ALASAN =
  /\b(karena|sebab|alasan|pengalaman|tanggung ?jawab|beban kerja|keahlian|skill|kemampuan|portofolio|sertifikat|kualifikasi|ump|umk|upah minimum|standar|pasar|biaya hidup|lembur|jam kerja|target|lulusan|jurusan)\b/i;
const RE_SOPAN =
  /\b(terima ?kasih|makasih|mohon|maaf|izin|apakah|bisakah|boleh|kiranya|memungkinkan|berkenan|bapak|ibu)\b/i;
const RE_KASAR = /\b(bodoh|goblok|tolol|anjing|bangsat|kampret|sialan|brengsek|gila|payah|pelit)\b/i;
const RE_TERIMA = /\b(saya terima|setuju|sepakat|deal|oke saya ambil|baik,? saya ambil|saya ambil)\b/i;
const RE_MINTA = /\b(naik|dinaikkan|nego|negosiasi|dibicarakan|ditinjau|disesuaikan|lebih tinggi|berharap|harap|minta|mengharapkan|ekspektasi)\b/i;
const RE_UMP = /\b(ump|umk|upah minimum)\b/i;

/** Ambil nominal rupiah dari teks: "Rp3.500.000", "3,5 juta", "3500000". */
export function ambilNominal(teks: string): number | null {
  const juta = teks.match(/(\d+(?:[.,]\d+)?)\s*(juta|jt)\b/i);
  if (juta) {
    return Math.round(parseFloat(juta[1].replace(',', '.')) * 1_000_000);
  }
  const rp = teks.match(/rp\.?\s*([\d.,]+)/i);
  const angka = rp?.[1] ?? teks.match(/\b\d{1,3}(?:\.\d{3}){2,}\b|\b\d{6,9}\b/)?.[0];
  if (!angka) return null;
  const n = parseInt(angka.replace(/[.,]/g, ''), 10);
  return Number.isFinite(n) && n >= 100000 ? n : null;
}

const kutip = (teks: string, maks = 90) =>
  teks.length > maks ? `${teks.slice(0, maks).trimEnd()}…` : teks;

/* ───────────────────────── HRD berbasis aturan (tanpa AI) ───────────────────────── */

export function balasHrdAturan(ctx: KonteksLatihan, messages: PesanLatihan[]): string {
  const pesanPengguna = messages.filter((m) => m.pengirim === 'pengguna');
  const terakhir = pesanPengguna[pesanPengguna.length - 1]?.isi ?? '';
  const putaran = pesanPengguna.length;
  const sudahTawarBatas = messages.some(
    (m) => m.pengirim === 'hrd' && m.isi.includes(rupiah(ctx.batasNaik))
  );

  if (RE_KASAR.test(terakhir)) {
    return 'Saya memahami kamu kecewa, tetapi mari kita lanjutkan diskusi ini dengan bahasa yang profesional. Apa yang sebenarnya kamu harapkan dari tawaran ini?';
  }

  if (RE_TERIMA.test(terakhir)) {
    return 'Terima kasih atas kesepakatannya. Kami akan menyiapkan kontrak kerja tertulis berisi gaji, tunjangan, dan jam kerja untuk kamu tinjau sebelum ditandatangani.';
  }

  if (putaran >= 6) {
    return 'Terima kasih sudah berdiskusi dengan terbuka. Kami akan menyampaikan poin-poinmu kepada atasan dan memberi kabar secepatnya.';
  }

  // Pertanyaan topik tertentu
  if (/\bbpjs\b/i.test(terakhir)) {
    return 'Karyawan didaftarkan BPJS Kesehatan dan BPJS Ketenagakerjaan sesuai ketentuan, dan rinciannya akan tercantum di kontrak. Ada hal lain yang ingin kamu pastikan?';
  }
  if (/\b(tunjangan|insentif|bonus)\b/i.test(terakhir)) {
    return `Angka ${rupiah(ctx.gaji)} itu gaji pokok. Tunjangan akan dijelaskan rinci di kontrak sesuai kebijakan perusahaan. Apakah ada komponen tertentu yang penting bagimu?`;
  }
  if (/\b(percobaan|probation)\b/i.test(terakhir)) {
    return 'Masa percobaan berlaku maksimal 3 bulan dan gajinya sama dengan yang tertulis di kontrak. Setelah itu kinerjamu akan dievaluasi.';
  }
  if (/\b(jam kerja|lembur|shift|hari kerja)\b/i.test(terakhir)) {
    return 'Jam kerja mengikuti aturan perusahaan, dan lembur di luar jam tersebut dihitung terpisah. Apakah jam kerja menjadi pertimbangan utamamu?';
  }

  const nominal = ambilNominal(terakhir);
  const adaAlasan = RE_ALASAN.test(terakhir);

  // Pelamar menyinggung UMP padahal tawaran di bawahnya
  if (RE_UMP.test(terakhir) && ctx.diBawahWajib) {
    return `Terima kasih sudah menyampaikannya. Kami akan meninjau ulang agar sesuai ${ctx.namaPatokan} sebesar ${rupiah(ctx.ump)}. Apakah angka tersebut bisa kamu terima?`;
  }
  if (RE_UMP.test(terakhir) && !ctx.wajibUmp) {
    return ctx.jenisLabel === 'Magang'
      ? 'Untuk program magang, yang kami berikan adalah uang saku, bukan upah, sehingga UMP tidak berlaku. Namun kami terbuka membahas besarannya jika kamu punya alasan.'
      : 'Sebagai usaha kecil, upah kami tetapkan berdasarkan kesepakatan. Namun kami terbuka membahasnya. Apa alasanmu dan berapa angka yang kamu harapkan?';
  }

  if (nominal !== null) {
    if (!adaAlasan) {
      return `Baik, kamu mengharapkan ${rupiah(nominal)}. Boleh saya tahu apa yang membuat angka itu sesuai untuk posisi ini?`;
    }
    if (nominal <= ctx.gaji) {
      return 'Angka tersebut sudah sesuai dengan tawaran kami. Apakah ada hal lain yang ingin kamu pastikan sebelum menyetujui?';
    }
    if (nominal <= ctx.batasNaik) {
      return `Alasanmu cukup kuat. Saya akan mengajukan ${rupiah(nominal)} kepada atasan untuk disetujui. Apakah ada hal lain yang ingin kamu sampaikan?`;
    }
    if (sudahTawarBatas) {
      return `Saya mengerti, tetapi ${rupiah(ctx.batasNaik)} adalah batas maksimal kami untuk posisi ini. Kami bisa meninjau kembali setelah evaluasi kinerja.`;
    }
    return `Angka ${rupiah(nominal)} di atas anggaran kami. Dengan mempertimbangkan alasanmu, kami bisa menawarkan ${rupiah(ctx.batasNaik)}. Bagaimana menurutmu?`;
  }

  if (RE_MINTA.test(terakhir)) {
    if (!adaAlasan) {
      return 'Tentu bisa kita bicarakan. Boleh saya tahu alasanmu dan berapa angka yang kamu harapkan?';
    }
    return 'Alasanmu bisa kami pahami. Berapa angka yang menurutmu sesuai untuk posisi ini?';
  }

  if (adaAlasan) {
    return 'Terima kasih atas penjelasannya. Agar bisa saya ajukan ke atasan, berapa angka yang kamu harapkan?';
  }

  return 'Bisa dijelaskan lebih lanjut apa yang kamu harapkan dari tawaran ini?';
}

/* ───────────────────────── Evaluasi berbasis aturan (tanpa AI) ───────────────────────── */

const batas = (n: number) => Math.max(1, Math.min(5, n));

/** Angka contoh yang masuk akal untuk disarankan kepada pelamar. */
const targetSaran = (ctx: KonteksLatihan) =>
  bulatkan(Math.max(ctx.gaji * 1.1, ctx.diBawahWajib ? ctx.ump : 0), ctx.satuan);

export function contohKalimatNegosiasi(ctx: KonteksLatihan): string {
  if (ctx.diBawahWajib) {
    return `Terima kasih atas tawarannya. Karena nominal ini masih di bawah ${ctx.namaPatokan} sebesar ${rupiah(ctx.ump)}, apakah upahnya bisa disesuaikan setidaknya ke angka tersebut?`;
  }
  const target = bulatkan(ctx.gaji * 1.1, ctx.satuan);
  const posisi = ctx.posisi === 'posisi yang dilamar' ? 'posisi ini' : `posisi ${ctx.posisi}`;
  return `Terima kasih atas tawarannya. Dengan tanggung jawab di ${posisi} dan pengalaman saya, apakah upahnya bisa ditinjau ke ${rupiah(target)} ${ctx.labelSatuan}?`;
}

export function evaluasiAturan(ctx: KonteksLatihan, messages: PesanLatihan[]): EvaluasiLatihan {
  const pesan = messages.filter((m) => m.pengirim === 'pengguna').map((m) => m.isi.trim());

  if (pesan.length === 0) {
    return {
      skor_kejelasan: 1,
      skor_alasan: 1,
      skor_kesopanan: 1,
      total_skor: 3,
      maksimal_skor: 15,
      masukan: 'Kamu belum mengirim balasan. Mulailah dengan menyampaikan tanggapanmu terhadap tawaran.',
      contoh_kalimat: contohKalimatNegosiasi(ctx),
    };
  }

  const adaAngka = pesan.some((p) => ambilNominal(p) !== null);
  const rataKata = pesan.reduce((s, p) => s + p.split(/\s+/).length, 0) / pesan.length;
  const adaPermintaan = pesan.some((p) => RE_MINTA.test(p) || ambilNominal(p) !== null);
  const pesanBeralasan = pesan.filter((p) => RE_ALASAN.test(p));
  const pakaiData = pesan.some((p) => RE_UMP.test(p) || /\b(standar|pasar|data)\b/i.test(p));
  const jumlahSopan = pesan.filter((p) => RE_SOPAN.test(p)).length;
  const kasar = pesan.some((p) => RE_KASAR.test(p));
  const teriak = pesan.some((p) => /!{2,}/.test(p) || (p.length > 12 && p === p.toUpperCase()));

  const skorKejelasan = batas(1 + (adaPermintaan ? 1 : 0) + (adaAngka ? 2 : 0) + (rataKata >= 8 ? 1 : 0));
  const skorAlasan = batas(1 + Math.min(3, pesanBeralasan.length) + (pakaiData ? 1 : 0));
  const skorKesopanan = kasar ? 1 : batas(2 + Math.min(2, jumlahSopan) + (teriak ? -1 : 1));

  // Masukan spesifik: kutip kalimat pengguna
  const bagian: string[] = [];
  if (pesanBeralasan.length > 0) {
    bagian.push(`Kalimat "${kutip(pesanBeralasan[0])}" sudah memberi alasan yang mendukung permintaanmu.`);
  } else {
    bagian.push(`Kalimat "${kutip(pesan[0])}" belum disertai alasan.`);
  }

  const terendah = Math.min(skorKejelasan, skorAlasan, skorKesopanan);
  if (skorKesopanan === terendah && skorKesopanan < 4) {
    bagian.push('Awali dengan ucapan terima kasih dan gunakan kalimat tanya seperti "apakah memungkinkan…" agar tidak terdengar menuntut.');
  } else if (skorKejelasan === terendah && skorKejelasan < 4) {
    bagian.push(`Sebutkan angka yang kamu harapkan secara spesifik, misalnya ${rupiah(targetSaran(ctx))} ${ctx.labelSatuan}.`);
  } else if (skorAlasan < 5) {
    bagian.push(
      ctx.diBawahWajib
        ? `Tawaran ini di bawah ${ctx.namaPatokan} (${rupiah(ctx.ump)}). Gunakan angka itu sebagai alasan objektif.`
        : `Kaitkan permintaanmu dengan tanggung jawab di ${ctx.posisi} atau pengalaman yang relevan.`
    );
  } else {
    bagian.push('Pertahankan cara ini: permintaan jelas, beralasan, dan tetap sopan.');
  }

  return {
    skor_kejelasan: skorKejelasan,
    skor_alasan: skorAlasan,
    skor_kesopanan: skorKesopanan,
    total_skor: skorKejelasan + skorAlasan + skorKesopanan,
    maksimal_skor: 15,
    masukan: bagian.join(' '),
    contoh_kalimat: contohKalimatNegosiasi(ctx),
  };
}

/* ───────────────────────── Saran argumen (dinamis) ───────────────────────── */

export function buatSaranArgumen(ctx: KonteksLatihan, messages: PesanLatihan[]): string {
  const pesan = messages.filter((m) => m.pengirim === 'pengguna').map((m) => m.isi);
  const semua = pesan.join(' ');

  if (pesan.length === 0) {
    if (ctx.diBawahWajib) {
      return `Tawaran ${rupiah(ctx.gaji)} ${ctx.labelSatuan} masih ${rupiah(Math.abs(ctx.selisih))} di bawah ${ctx.namaPatokan} (${rupiah(ctx.ump)}). Sampaikan dengan sopan dan jadikan angka itu sebagai alasan objektif.`;
    }
    if (!ctx.wajibUmp) {
      return `UMP tidak wajib untuk kondisi ini, jadi fokuskan argumen pada tanggung jawab, pengalaman, dan kesepakatan tertulis. Mulailah dengan berterima kasih.`;
    }
    return `Tawaran ${rupiah(ctx.gaji)} ${ctx.labelSatuan} ${ctx.labelPosisi.toLowerCase()} ${ctx.namaPatokan}. Mulailah dengan berterima kasih, lalu sampaikan harapanmu beserta alasannya.`;
  }

  if (!RE_ALASAN.test(semua)) {
    return ctx.diBawahWajib
      ? `Kamu belum memberi alasan. Sebutkan bahwa tawaran ini di bawah ${ctx.namaPatokan} (${rupiah(ctx.ump)}).`
      : `Kamu belum memberi alasan. Kaitkan permintaanmu dengan tanggung jawab di ${ctx.posisi} atau pengalamanmu.`;
  }

  if (!pesan.some((p) => ambilNominal(p) !== null)) {
    return `Sebutkan angka spesifik yang kamu harapkan, misalnya ${rupiah(targetSaran(ctx))} ${ctx.labelSatuan}, agar HRD bisa menanggapinya.`;
  }

  const belumDitanya = ctx.pertanyaan.find((q) => {
    const kunci = q.toLowerCase().match(/(tunjangan|bpjs|percobaan|ditinjau|jam kerja|tertulis|pokok|struktur|skala)/)?.[1];
    return kunci ? !semua.toLowerCase().includes(kunci) : false;
  });
  if (belumDitanya) {
    return `Argumenmu sudah jelas. Sebelum menutup, coba tanyakan: "${belumDitanya}"`;
  }

  return 'Argumenmu sudah lengkap. Tutup dengan sopan, lalu klik Selesai untuk melihat penilaian.';
}

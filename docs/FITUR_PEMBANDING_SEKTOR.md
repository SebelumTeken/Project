# Spesifikasi Teknis: Pembanding Pasar per Bidang Usaha (Cek Tawaran)

Versi 2 · 8 November 2026 · Untuk developer dan AI coding assistant tim SebelumTeken
Disusun berdasarkan kode per 8 November 2026 pukul 04.50 (`upah.ts` dengan perhitungan per jam/harian, `latihan.ts`, `pertanyaan.ts`, `aturan.ts`).

> **Untuk AI coding assistant, baca dulu:**
> 1. Bagian 0 (Yang tidak boleh diubah) dan Bagian 3 (Aturan Data Upah) bersifat wajib dan mengalahkan instruksi lain yang bertentangan.
> 2. Fitur ini **hanya menambah**. Jangan menghapus, mengganti nama, atau menulis ulang kode yang sudah ada.
> 3. Jika fungsi, variabel, atau komentar penanda yang disebut di dokumen ini **tidak ditemukan** di kode, **berhenti dan laporkan ke developer**. Jangan membuat fungsi pengganti, jangan menebak lokasi lain.
> 4. Jangan mengarang angka upah, jangan mengubah nilai di `src/data/upah-sektor.json`, dan jangan memindahkan perhitungan angka ke AI.

---

## 0. Yang tidak boleh diubah

Kode di bawah ini milik anggota tim lain dan sudah diuji. Fitur ini tidak memerlukan perubahan apa pun di sana.

| File / bagian | Alasan |
|---|---|
| `src/lib/upah.ts` (seluruh file) | Logika UMP, per jam (÷126), harian (÷25 / ÷21), `wajibUmp`, `perlu_dicek` |
| `src/lib/latihan.ts` (seluruh file) | `buatKonteksLatihan`, `KonteksLatihan`, `batasNaik`, `buatPembuka`, `balasHrdAturan`, `evaluasiAturan` |
| `src/lib/aturan.ts`, `src/lib/pertanyaan.ts` | Ringkasan aturan dan pertanyaan di halaman hasil |
| Di `src/lib/prompts.ts`: fungsi `blokKonteks`, `konteksAtauNull`, isi ATURAN PERILAKU 1 sampai 8, RUBRIK, ATURAN MASUKAN | Perilaku HRD dan cara penilaian |
| `src/data/upah-minimum.json` | UMP dan UMSP |
| Kalimat UMSP di `HasilTawaran.tsx` ("Dua sektor usaha tertentu memakai UMSP...") | Informasi hukum yang benar, bukan pelanggaran aturan dokumen ini |
| Semua file tes yang sudah ada (`*.test.ts`) | Tes baru dibuat di file baru (T6) |

---

## 1. Ringkasan

Di halaman Cek Tawaran, pengguna dengan status **Penuh waktu** dapat memilih **bidang usaha perusahaan**. Halaman hasil lalu menampilkan **gambaran pasar**: rata-rata upah nasional bidang itu (BPS) dan rata-rata upah Sumatera Barat. Baris yang sama dikirim ke AI (HRD dan evaluator latihan) sebagai konteks.

**Patokan hukum tetap UMP.** Gambaran pasar hanya konteks dan tidak pernah mengubah hasil `hitungPatokanUpah()`.

**Hanya untuk penuh waktu.** Rata-rata BPS adalah gaji *bulanan* buruh/karyawan. Nominal paruh waktu (per jam), harian (per hari), dan uang saku magang tidak sebanding, jadi tidak dibandingkan. Pengaman ini sudah ada di `upahSektor.ts`.

### Alur

```
CekTawaran (status Penuh waktu → pilih bidang usaha)
   └─ setTawaran({ ..., sektor_usaha })
        ├─ HasilTawaran: section "Gambaran pasar" (baru, sebelum section "Aturan yang berlaku")
        └─ prompts.ts: konteks = blokKonteks(ctx) + buatKonteksPasarUntukAi(tawaran)
              ├─ buatPromptHrd()             + blok ATURAN_DATA_UPAH
              └─ buatPromptEvaluasiLatihan() + blok ATURAN_DATA_UPAH
```

### Di luar cakupan

- Mengubah perhitungan UMP, per jam, harian, atau `perlu_dicek`
- Menghubungkan pilihan bidang usaha dengan UMSP
- Data per kabupaten/kota atau per jabatan
- Memanggil API BPS secara langsung

---

## 2. Status file

| File | Status | Tugas |
|---|---|---|
| `src/data/upah-sektor.json` | Sudah ada, **jangan diubah** | |
| `src/lib/upahSektor.ts` | Sudah ada, siap dipakai | |
| `src/lib/upahSektor.test.ts` | Sudah ada, 12 tes lulus | |
| `src/types.ts` | Tambah 1 field opsional | T1 |
| `src/pages/CekTawaran.tsx` | Tambah 1 state, 1 field, 1 baris di `setTawaran` | T2 |
| `src/pages/HasilTawaran.tsx` | Tambah import, 1 konstanta, 1 section | T3 |
| `src/lib/prompts.ts` | Tambah import, ubah 2 baris `const konteks`, sisipkan 2 blok aturan | T4 |
| `src/data/demo-kasus.json` | Tambah 1 field | T5 |
| `src/lib/promptPasar.test.ts` | **File baru** | T6 |

### API `src/lib/upahSektor.ts`

| Ekspor | Kegunaan |
|---|---|
| `DAFTAR_SEKTOR: SektorUsaha[]` | Isi dropdown. Tiap item: `kode`, `label`, `contoh`, `rata_nasional` |
| `PERIODE_DATA_SEKTOR: string` | `"Agustus 2025"` |
| `RATA_NASIONAL`, `RATA_SUMBAR: number` | 3.331.012 dan 2.911.450 |
| `PERSEN_SUMBAR_TERHADAP_NASIONAL: number` | 87 |
| `formatRupiahPasar(n)` | `"Rp2.839.730"` |
| `bisaDibandingkanDenganRataRata(jenis)` | `true` hanya untuk `'penuh_waktu'` |
| `cariSektor(kode)` | `null` untuk `'tidak_tahu'` atau kode tak dikenal |
| `bandingkanDenganRataRata(gaji, kode, jenisPekerjaan)` | Untuk layar hasil. `null` jika bukan penuh waktu, sektor tidak diketahui, atau gaji ≤ 0 |
| `buatKonteksPasarUntukAi(tawaran)` | `string[]` siap gabung ke KONTEKS TAWARAN. `[]` jika `tawaran` null |
| `ATURAN_DATA_UPAH: string` | Blok aturan untuk prompt AI |

`PembandingPasar`: `sektor`, `rataNasionalSektor`, `rataSumbarSemuaSektor`, `persenDariRataNasional`, `rataSektorDiBawahUmp`, `catatan: string[]`.

---

## 3. Aturan Data Upah (wajib)

### 3.1 Hierarki patokan

1. **UMP Sumatera Barat 2026 = Rp3.182.955** (SK Gubernur Sumbar 562-851-2025). Patokan hukum utama, dihitung oleh `hitungPatokanUpah()`.
2. **UMSP Sumatera Barat 2026 = Rp3.214.846** (SK Gubernur Sumbar 562-853-2025), hanya untuk dua sektor tertentu. Sudah ditampilkan sebagai catatan di halaman hasil. Jangan dihubungkan dengan pilihan bidang usaha, karena dua sektornya belum dipetakan ke KBLI.
3. **Rata-rata BPS** hanya gambaran pasar. Tidak boleh dipakai untuk menyatakan tawaran "layak", "wajar", "aman", atau "melanggar".

Alasan: rata-rata upah di 6 dari 8 jenis pekerjaan di Sumbar dan di 6 dari 17 bidang usaha nasional berada **di bawah UMP Sumbar**. Rata-rata ikut memuat pekerja yang dibayar di bawah UMP.

### 3.2 Sumber data

| Data | Nilai | Periode | Sumber |
|---|---|---|---|
| Rata-rata nasional per 17 bidang usaha (KBLI) | lihat `upah-sektor.json` | Agustus 2025 | [BPS var 1521](https://www.bps.go.id/id/statistics-table/2/MTUyMSMy/rata-rata-upah-gaji--rupiah-.html) |
| Rata-rata nasional semua bidang | Rp3.331.012 | Agustus 2025 | BPS var 1521 |
| Rata-rata pekerja formal Sumatera Barat | Rp2.911.450 | Agustus 2025 | [BPS Sumbar var 285](https://sumbar.bps.go.id/id/statistics-table/2/Mjg1IzI=/rata-rata-upah-gaji-bersih-sebulan-pekerja-formal-menurut-kabupaten-kota-dan-lapangan-pekerjaan-utama.html) |

Definisi BPS: upah/gaji bersih sebulan buruh/karyawan/pegawai = upah pokok + tunjangan (uang atau barang).

Label bidang usaha di `upah-sektor.json` adalah penyederhanaan dari kategori KBLI 2020 supaya mudah dipahami. Tabel BPS sendiri hanya memakai huruf kategori.

### 3.3 Aturan pemakaian

| No | Aturan | Contoh benar | Contoh salah |
|---|---|---|---|
| D1 | Selalu beri label wilayah pada setiap rata-rata | "Rata-rata nasional bidang Toko..." | "Rata-rata bidang Toko..." |
| D2 | Selalu sebut sumber dan periode | "(BPS, Agustus 2025)" | angka tanpa sumber |
| D3 | Jangan mencampur periode | nasional Agu 2025 vs Sumbar Agu 2025 | nasional Agu 2025 vs Sumbar Feb 2026 |
| D4 | Rata-rata tidak boleh mengubah label UMP | label tetap "Di bawah patokan" | "Di bawah UMP tapi wajar untuk sektornya" |
| D5 | Kata terlarang **untuk rata-rata BPS** | "gambaran pasar", "pembanding" | "standar", "layak", "seharusnya" |
| D6 | Jika rata-rata sektor < UMP, catatan wajib tampil | render `pasar.catatan` | menyembunyikan catatan |
| D7 | Semua angka dihitung di kode | `bandingkanDenganRataRata()` | meminta AI menghitung persen |
| D8 | AI hanya menerima baris relevan | `buatKonteksPasarUntukAi()` | menempel isi JSON utuh ke prompt |
| D9 | Jangan menampilkan angka kabupaten/kota | | Rp987.871 (sampel kecil) |
| D10 | Nilai JSON hanya diubah dengan data BPS baru, bersama periode dan URL | update ketiganya | mengubah satu angka saja |
| D11 | Hanya bandingkan nominal bulanan penuh waktu | biarkan pengaman di `upahSektor.ts` | menghapus parameter `jenisPekerjaan` |
| D12 | Rata-rata tidak boleh dipakai untuk membenarkan gaji di bawah UMP | sudah ada di `ATURAN_DATA_UPAH` | HRD: "di Sumbar memang segini, jadi di bawah UMP wajar" |

D5 hanya berlaku untuk rata-rata BPS. Kalimat yang sudah ada seperti "Berikut standar gaji yang perlu kamu cek" (tentang UMP) di `HasilTawaran.tsx` dan kata "standar"/"pasar" di regex `RE_ALASAN` di `latihan.ts` **tidak perlu diubah**.

### 3.4 Perilaku kode sekarang (acuan, jangan diubah)

| Kondisi | Hasil `hitungPatokanUpah()` | Kartu pasar |
|---|---|---|
| Penuh waktu, menengah/besar | Banding per bulan dengan UMP, `wajibUmp = true` | Tampil jika bidang dipilih |
| Paruh waktu, menengah/besar | Banding per jam, patokan UMP ÷ 126 (PP 36/2021 Pasal 16) | Tidak tampil |
| Harian, menengah/besar | Banding per hari, UMP ÷ 25 (6 hari) atau ÷ 21 (5 hari) (Pasal 17) | Tidak tampil |
| Magang | `perlu_dicek` (uang saku, bukan upah) | Tidak tampil |
| Skala mikro/kecil | `perlu_dicek` (Pasal 36) | Tampil jika penuh waktu dan bidang dipilih |
| Skala tidak tahu | `perlu_dicek` | Tampil jika penuh waktu dan bidang dipilih |

PP 36/2021 sudah diubah oleh PP 51/2023 (dokumen ide juga menyebut PP 49/2025). Pasal di atas perlu dicek sebelum dikutip di UI baru.

---

## 4. Tugas implementasi

Kerjakan berurutan. Setelah tiap tugas jalankan `npx tsc --noEmit` dan `npm test`. Sebelum T1, semua tes harus sudah lulus. Jika ada yang gagal, berhenti dan laporkan.

### T1. Tipe data (`src/types.ts`)

Di `interface TawaranData`, tambahkan satu field **opsional** setelah `hari_kerja_per_minggu?`:

```ts
  /** Kode bidang usaha dari src/data/upah-sektor.json, atau 'tidak_tahu'. Hanya dipakai untuk penuh waktu. */
  sektor_usaha?: string;
```

Jangan mengubah field lain.

### T2. Form (`src/pages/CekTawaran.tsx`)

1. Tambahkan import:
   ```tsx
   import { DAFTAR_SEKTOR } from '../lib/upahSektor';
   ```
2. Tambahkan state tepat setelah baris `const [skala, setSkala] = useState<Skala>(...)`:
   ```tsx
   const [sektor, setSektor] = useState<string>(lama?.sektor_usaha ?? 'tidak_tahu');
   ```
3. Di `handleBandingkan`, di dalam objek `setTawaran({ ... })`, tambahkan satu baris setelah `hari_kerja_per_minggu: hariKerja,`:
   ```tsx
   sektor_usaha: status === 'penuh_waktu' ? sektor : undefined,
   ```
   Jangan mengubah objek `input` atau pemanggilan `hitungPatokanUpah`.
4. Sisipkan blok berikut **di antara** blok `{/* 4. Skala tempat kerja */}` dan `{/* 5. Aksi */}`:
   ```tsx
   {/* 4b. Bidang usaha (hanya penuh waktu, untuk gambaran pasar BPS) */}
   {status === 'penuh_waktu' && (
     <div className="w-full flex flex-col gap-2.5">
       <label htmlFor="sektor-input" className="font-semibold text-[14px] leading-5 text-text">
         Perusahaannya bergerak di bidang apa?
       </label>
       <select
         id="sektor-input"
         value={sektor}
         onChange={(e) => setSektor(e.target.value)}
         className="w-full h-12 px-5 bg-surface rounded-full text-[16px] text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
       >
         <option value="tidak_tahu">Tidak tahu</option>
         {DAFTAR_SEKTOR.map((s) => (
           <option key={s.kode} value={s.kode}>
             {s.label} ({s.contoh})
           </option>
         ))}
       </select>
       <p className="px-1 text-[13px] leading-5 text-secondary">
         Pilih bidang perusahaan, bukan jabatan kamu. Contoh: admin di bank pilih Bank, asuransi, pembiayaan. Boleh dikosongkan.
       </p>
     </div>
   )}
   ```

**Aturan:** field tidak wajib. Kondisi `disabled` tombol "Bandingkan" tidak berubah. Jangan menampilkan kode KBLI (A, B, C) ke pengguna.

**Selesai jika:** status Penuh waktu menampilkan field; Paruh waktu, Harian, dan Magang tidak. Memilih bidang lalu "Bandingkan", kemudian kembali lewat "Ubah nominal atau konteks tawaran", menampilkan pilihan yang sama.

### T3. Section "Gambaran pasar" (`src/pages/HasilTawaran.tsx`)

1. Tambahkan import (jangan mengubah import yang sudah ada):
   ```tsx
   import { bandingkanDenganRataRata, formatRupiahPasar, PERIODE_DATA_SEKTOR } from '../lib/upahSektor';
   ```
2. Tambahkan tepat setelah baris `const satuan = LABEL_SATUAN[calculation.satuan];`:
   ```tsx
   const pasar = bandingkanDenganRataRata(
     activeTawaran.gaji_bulanan,
     activeTawaran.sektor_usaha,
     activeTawaran.jenis_pekerjaan
   );
   ```
3. Sisipkan section berikut **tepat sebelum** komentar `{/* Aturan yang berlaku untuk kondisi tawaran ini */}`. Jangan menaruhnya di dalam panel kiri atau kanan, supaya tata letak dua panel tidak berubah.
   ```tsx
   {/* Gambaran pasar BPS: konteks, bukan patokan. Hanya untuk penuh waktu. */}
   {pasar && (
     <section aria-labelledby="pasar-heading" className="w-full max-w-[760px] mb-12 sm:mb-16">
       <h2
         id="pasar-heading"
         className="font-semibold text-[24px] sm:text-[28px] leading-[34px] tracking-[-0.7px] text-text mb-2"
       >
         Gambaran pasar (bukan patokan)
       </h2>
       <div className="bg-surface rounded-3xl px-5 sm:px-8 py-6 flex flex-col gap-2">
         <p className="font-medium text-[16px] leading-6 text-text">
           Rata-rata nasional bidang {pasar.sektor.label}: {formatRupiahPasar(pasar.rataNasionalSektor)}
         </p>
         <p className="text-[14px] leading-5 text-secondary">
           Tawaran kamu {pasar.persenDariRataNasional}% dari rata-rata itu.
         </p>
         <p className="text-[14px] leading-5 text-secondary">
           Rata-rata semua bidang di Sumatera Barat: {formatRupiahPasar(pasar.rataSumbarSemuaSektor)}
         </p>
         {pasar.catatan.map((c) => (
           <p key={c} className="text-[13px] leading-5 text-secondary">
             {c}
           </p>
         ))}
       </div>
       <p className="mt-3 px-1 text-[12px] leading-4 text-secondary">
         Sumber: BPS, Sakernas {PERIODE_DATA_SEKTOR}.
       </p>
     </section>
   )}
   ```
   Jangan memakai warna `warning`, `success`, atau `accent` di section ini. Section ini tidak boleh lebih menonjol dari hasil UMP.

**Selesai jika:**
- Penuh waktu, bidang "Toko, distributor, dealer, bengkel", Rp2.800.000: section menampilkan Rp2.839.730, 99%, Rp2.911.450, dan catatan "bukan patokan layak".
- Bidang "Tidak tahu", atau status selain Penuh waktu: section tidak muncul dan halaman sama seperti sebelumnya.
- Label posisi UMP, bar proporsi, pertanyaan, aturan, dan catatan UMSP tidak berubah.

### T4. Konteks AI (`src/lib/prompts.ts`)

1. Tambahkan import:
   ```ts
   import { ATURAN_DATA_UPAH, buatKonteksPasarUntukAi } from './upahSektor';
   ```
2. Di `buatPromptHrd()`, ganti **hanya** baris `blokKonteks(ctx)` di dalam `const konteks = ctx ? ... : ...`:
   ```ts
   // sebelum
   const konteks = ctx
     ? blokKonteks(ctx)
     : '- Posisi dan nominal tawaran belum diketahui. Tanyakan harapan pelamar.';
   // sesudah
   const konteks = ctx
     ? [blokKonteks(ctx), ...buatKonteksPasarUntukAi(tawaran)].join('\n')
     : '- Posisi dan nominal tawaran belum diketahui. Tanyakan harapan pelamar.';
   ```
3. Di template string `buatPromptHrd()`, sisipkan blok berikut **di antara** aturan nomor 8 dan baris `FORMAT:` (dengan satu baris kosong di atas dan di bawahnya). Nomor dan isi aturan 1 sampai 8 tidak berubah.
   ```
   ${ATURAN_DATA_UPAH}
   ```
4. Di `buatPromptEvaluasiLatihan()`, lakukan perubahan yang sama pada `const konteks`:
   ```ts
   const konteks = ctx
     ? [blokKonteks(ctx), ...buatKonteksPasarUntukAi(tawaran)].join('\n')
     : '- Konteks tawaran tidak tersedia.';
   ```
5. Di template string `buatPromptEvaluasiLatihan()`, sisipkan `${ATURAN_DATA_UPAH}` **di antara** butir terakhir ATURAN MASUKAN ("Jika pelamar belum mengirim pesan...") dan baris "Kembalikan hanya JSON valid...". RUBRIK tidak berubah.

**Jangan:** mengubah `blokKonteks`, menambah field ke `KonteksLatihan`, mengubah `buatPromptAnalisisLowongan`, atau menambahkan aturan HRD baru selain blok `ATURAN_DATA_UPAH`.

### T5. Data contoh (`src/data/demo-kasus.json`)

Di objek `tawaran`, tambahkan setelah `"masa_kerja_kurang_1_tahun": true,`:
```json
"sektor_usaha": "G",
```
Alasan: posisi contoh "Admin Toko Online" masuk bidang Toko (G). Rata-rata nasionalnya Rp2.839.730, juga di bawah UMP. Juri langsung melihat kenapa rata-rata bukan patokan.

### T6. Tes baru (`src/lib/promptPasar.test.ts`, file baru)

Jangan mengubah `latihan.test.ts` atau tes lain. Buat file baru:

```ts
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
```

---

## 5. Definisi selesai

- [ ] `npx tsc --noEmit` tanpa error
- [ ] `npm test` lulus semua: tes lama (96 per 8 Nov 04.50), `upahSektor.test.ts`, dan `promptPasar.test.ts`
- [ ] `git diff` (atau perbandingan manual) hanya berisi tambahan di 6 file pada Bagian 2. Tidak ada baris lama yang terhapus selain 2 baris `blokKonteks(ctx)` di T4.
- [ ] Mode Contoh: halaman hasil tawaran menampilkan section pasar untuk bidang Toko
- [ ] Paruh waktu Rp25.000/jam: section pasar tidak muncul, hasil per jam sama seperti sebelumnya
- [ ] Latihan (Mode AI): tanya HRD "berapa gaji rata-rata admin di Jakarta?". HRD tidak boleh mengarang angka.
- [ ] Latihan (Mode AI), tawaran di bawah UMP: sebut UMP ke HRD. HRD tetap menyesuaikan ke UMP dan tidak memakai rata-rata Sumbar sebagai alasan menolak.
- [ ] Tidak ada teks UI baru yang memakai kata "standar", "layak", atau "seharusnya" untuk rata-rata BPS

---

## 6. Jawaban siap pakai untuk juri

**"Kenapa pakai data nasional padahal fokusnya Sumbar?"**
BPS tidak menerbitkan rincian 17 bidang usaha sampai tingkat provinsi. Karena itu kami tampilkan juga rata-rata Sumbar dari periode yang sama sebagai koreksi. Rata-rata Sumbar sekitar 87% dari nasional.

**"Kenapa rata-rata tidak dijadikan patokan?"**
Di Sumbar, rata-rata upah di 6 dari 8 jenis pekerjaan ada di bawah UMP. Kalau rata-rata dijadikan patokan, aplikasi justru akan membenarkan gaji di bawah UMP. Jadi UMP tetap batas bawah, dan rata-rata hanya gambaran pasar.

**"Kenapa pekerja harian dan paruh waktu tidak dapat pembanding pasar?"**
Rata-rata BPS adalah gaji bulanan. Membandingkan upah per jam atau per hari dengan angka bulanan akan menyesatkan, jadi untuk mereka kami hanya memakai patokan UMP yang sudah dikonversi sesuai PP 36/2021.

**"Bagaimana AI tidak mengarang angka?"**
Semua angka dihitung di kode. AI hanya menerima beberapa baris angka yang sudah jadi, dengan aturan untuk tidak memakai angka lain dan tidak memakai rata-rata untuk membenarkan gaji di bawah UMP. Data mentahnya tersimpan di satu file JSON yang bisa diaudit.

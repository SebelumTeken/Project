import { z } from 'zod';

export const TandaBahayaSchema = z.object({
  id: z.string().min(1),
  kode: z.string().min(1),
  label: z.string().min(1),
  bobot: z.enum(['sedang', 'tinggi']),
  sumber: z.string().min(1),
  saran_verifikasi: z.string().min(1),
});

export const TandaBahayaListSchema = z.array(TandaBahayaSchema);

export const AiTemuanSchema = z.object({
  kode_tanda: z.string().min(1),
  kutipan: z.string().min(1),
  penjelasan: z.string().min(1),
});

export const AiLowonganAnalysisSchema = z.object({
  teks_terbaca: z.string(),
  nama_perusahaan: z.string().nullable(),
  posisi: z.string().nullable(),
  lokasi: z.string().nullable(),
  gaji_tertulis: z.number().nullable(),
  kontak: z.string().nullable(),
  ringkasan: z.string(),
  temuan: z.array(AiTemuanSchema),
});

export const AiEvaluasiLatihanSchema = z.object({
  skor_kejelasan: z.number().int().min(1).max(5),
  skor_alasan: z.number().int().min(1).max(5),
  skor_kesopanan: z.number().int().min(1).max(5),
  masukan: z.string().min(1),
  contoh_kalimat: z.string().min(1),
});

export const AiBalasanHrdSchema = z.object({
  balasan: z.string().min(1),
});

export type AiTemuan = z.infer<typeof AiTemuanSchema>;
export type AiLowonganAnalysis = z.infer<typeof AiLowonganAnalysisSchema>;
export type AiEvaluasiLatihan = z.infer<typeof AiEvaluasiLatihanSchema>;
export type AiBalasanHrd = z.infer<typeof AiBalasanHrdSchema>;

import { analisisKeLowongan } from './validasi';
import { nominalBulananTertinggi } from './deteksiLowongan';
import { AiEvaluasiLatihanSchema, AiLowonganAnalysisSchema } from './schemas';
import {
  buatPesanPercakapan,
  buatPromptAnalisisLowongan,
  buatPromptEvaluasiLatihan,
  buatPromptHrd,
} from './prompts';
import {
  EvaluasiLatihan,
  LowonganData,
  PesanLatihan,
  TawaranData,
} from '../types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const MODEL_GROQ = 'qwen/qwen3.8-27b';
/** Nama lama, dipakai fungsi latihan di bawah. */
const MODEL_ANALISIS_LOWONGAN = MODEL_GROQ;

/**
 * Qwen 3.8 27B di Groq mendukung reasoning_effort "none" untuk mematikan
 * mode berpikir. Tanpa ini, model bisa berpikir dulu sehingga respons lebih
 * lama dan token habis sebelum JSON selesai. Hapus baris ini jika model
 * diganti ke model yang tidak mendukung parameter tersebut.
 * Saat ini hanya dipakai analisis lowongan.
 */
const PENGATURAN_MODEL = { reasoning_effort: 'none' } as const;

/** Batas waktu permintaan analisis lowongan, dalam milidetik. */
export const BATAS_WAKTU_MS = {
  analisisLowongan: 45_000,
} as const;

const LOG = '[SebelumTeken AI]';

interface GroqResponse {
  choices?: Array<{
    finish_reason?: string | null;
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
}

/** Dilempar saat permintaan dibatalkan pengguna (misalnya meninggalkan halaman). */
export class AiDibatalkanError extends Error {
  constructor() {
    super('Permintaan ke AI dibatalkan.');
    this.name = 'AiDibatalkanError';
  }
}

export interface OpsiPermintaan {
  signal?: AbortSignal;
}

export function pesanErrorHttp(status: number, pesanServer?: string): string {
  const detail = pesanServer ? ` Detail: ${pesanServer}` : '';

  if (status === 401 || status === 403) {
    return `Kunci API Groq ditolak (HTTP ${status}). Periksa kunci di Pengaturan.${detail}`;
  }
  if (status === 404) {
    return `Model ${MODEL_GROQ} tidak ditemukan di Groq (HTTP 404).${detail}`;
  }
  if (status === 413) {
    return 'Gambar terlalu besar untuk dikirim ke AI (HTTP 413). Coba gambar yang lebih kecil.';
  }
  if (status === 429) {
    return `Batas pemakaian Groq tercapai (HTTP 429). Tunggu sebentar, lalu coba lagi.${detail}`;
  }
  if (status >= 500) {
    return `Server Groq sedang bermasalah (HTTP ${status}). Coba lagi beberapa saat lagi.`;
  }
  return `Permintaan ke Groq gagal (HTTP ${status}).${detail}`;
}

/** Membuang blok penalaran <think>…</think>, termasuk yang tidak ditutup. */
function buangBlokBerpikir(teks: string): string {
  return teks.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<think>[\s\S]*$/i, '');
}

/** Mengambil objek JSON dari jawaban AI, termasuk yang dibungkus markdown atau blok <think>. */
export function ambilJson(teks: string): unknown {
  const tanpaBerpikir = buangBlokBerpikir(teks);
  const fenced = tanpaBerpikir.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const kandidat = fenced?.[1] ?? tanpaBerpikir;
  const mulai = kandidat.indexOf('{');
  const selesai = kandidat.lastIndexOf('}');

  if (mulai === -1 || selesai <= mulai) {
    throw new Error('Jawaban AI tidak berisi JSON yang dapat dibaca. Coba lagi.');
  }

  try {
    return JSON.parse(kandidat.slice(mulai, selesai + 1));
  } catch {
    throw new Error('Jawaban AI berisi JSON yang tidak valid. Coba lagi.');
  }
}

/**
 * Memperbaiki variasi kecil dari AI sebelum divalidasi Zod, misalnya gaji
 * yang ditulis "Rp8.000.000" atau temuan yang tidak dikirim.
 */
export function normalisasiAnalisis(data: unknown): unknown {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
  const salinan: Record<string, unknown> = { ...(data as Record<string, unknown>) };

  if (typeof salinan.gaji_tertulis === 'string') {
    // "Rp5.000.000 - Rp15.000.000" → 15000000, "8 juta" → 8000000, "Rp150.000/hari" → setara per bulan.
    const teksGaji = salinan.gaji_tertulis.trim();
    const nominal = nominalBulananTertinggi(/^rp/i.test(teksGaji) ? teksGaji : `Rp${teksGaji}`);
    salinan.gaji_tertulis = nominal;
  }
  if (salinan.temuan === undefined || salinan.temuan === null) {
    salinan.temuan = [];
  }
  for (const kolom of ['nama_perusahaan', 'posisi', 'lokasi', 'kontak', 'gaji_tertulis']) {
    if (salinan[kolom] === undefined || salinan[kolom] === '') salinan[kolom] = null;
  }
  if (salinan.ringkasan === undefined || salinan.ringkasan === null) {
    salinan.ringkasan = '';
  }

  return salinan;
}

function pesanKolomBermasalah(issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey> }>): string {
  return issues
    .slice(0, 3)
    .map((issue) => issue.path.map(String).join('.') || '(seluruh jawaban)')
    .join(', ');
}

interface HasilGroq {
  content: string;
  finishReason: string | null;
}

async function kirimKeGroq(
  apiKey: string,
  body: Record<string, unknown>,
  opsi: { label: string; batasWaktuMs: number; signal?: AbortSignal }
): Promise<HasilGroq> {
  if (!apiKey.trim()) {
    throw new Error('Kunci API Groq belum diisi. Buka Pengaturan untuk mengisinya.');
  }
  if (opsi.signal?.aborted) {
    throw new AiDibatalkanError();
  }

  const controller = new AbortController();
  let habisWaktu = false;
  const timer = setTimeout(() => {
    habisWaktu = true;
    controller.abort();
  }, opsi.batasWaktuMs);
  const teruskanPembatalan = () => controller.abort();
  opsi.signal?.addEventListener('abort', teruskanPembatalan);

  const payload = JSON.stringify({ model: MODEL_GROQ, ...PENGATURAN_MODEL, ...body });
  const ukuranKb = Math.round(payload.length / 1024);
  const mulai = performance.now();

  try {
    let response: Response;
    let teksRespons: string;
    try {
      response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: payload,
        signal: controller.signal,
      });
      teksRespons = await response.text();
    } catch (error) {
      const durasiMs = Math.round(performance.now() - mulai);
      if (habisWaktu) {
        console.warn(LOG, opsi.label, 'habis waktu', { durasiMs, ukuranKb });
        throw new Error(
          `AI tidak merespons dalam ${Math.round(opsi.batasWaktuMs / 1000)} detik. Coba lagi, atau pakai gambar yang lebih kecil.`
        );
      }
      if (opsi.signal?.aborted) {
        throw new AiDibatalkanError();
      }
      console.error(LOG, opsi.label, 'gagal terhubung', { durasiMs, ukuranKb, error });
      throw new Error('Tidak dapat terhubung ke Groq. Periksa koneksi internet, lalu coba lagi.');
    }

    let data: GroqResponse = {};
    try {
      data = JSON.parse(teksRespons) as GroqResponse;
    } catch {
      // Respons bukan JSON (misalnya halaman error). Ditangani di bawah.
    }

    const durasiMs = Math.round(performance.now() - mulai);
    const pilihan = data.choices?.[0];
    const finishReason = pilihan?.finish_reason ?? null;

    if (!response.ok) {
      console.error(LOG, opsi.label, {
        status: response.status,
        durasiMs,
        ukuranKb,
        pesan: data.error?.message ?? teksRespons.slice(0, 300),
      });
      throw new Error(pesanErrorHttp(response.status, data.error?.message));
    }

    console.info(LOG, opsi.label, { status: response.status, durasiMs, ukuranKb, finishReason });

    const content = pilihan?.message?.content;
    if (!content || !content.trim()) {
      throw new Error('Groq tidak mengembalikan jawaban. Coba lagi.');
    }

    return { content, finishReason };
  } finally {
    clearTimeout(timer);
    opsi.signal?.removeEventListener('abort', teruskanPembatalan);
  }
}

export async function analisisLowongan(
  apiKey: string,
  gambarData: string,
  opsi: OpsiPermintaan = {}
): Promise<LowonganData> {
  if (!/^data:image\/(?:jpeg|png);base64,/.test(gambarData)) {
    throw new Error('Format gambar tidak didukung untuk analisis AI. Gunakan JPG atau PNG.');
  }

  const { content, finishReason } = await kirimKeGroq(
    apiKey,
    {
      temperature: 0,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: buatPromptAnalisisLowongan(),
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: gambarData },
            },
            {
              type: 'text',
              text: 'Analisis poster lowongan ini sesuai format JSON yang diminta.',
            },
          ],
        },
      ],
    },
    {
      label: 'analisis lowongan',
      batasWaktuMs: BATAS_WAKTU_MS.analisisLowongan,
      signal: opsi.signal,
    }
  );

  if (finishReason === 'length') {
    throw new Error('Jawaban AI terpotong karena terlalu panjang. Coba lagi.');
  }

  const hasil = AiLowonganAnalysisSchema.safeParse(normalisasiAnalisis(ambilJson(content)));
  if (!hasil.success) {
    console.error(LOG, 'analisis lowongan: format tidak sesuai', hasil.error.issues, content);
    throw new Error(
      `Format jawaban AI tidak sesuai (kolom: ${pesanKolomBermasalah(hasil.error.issues)}). Coba lagi.`
    );
  }

  const { data, diagnosis } = analisisKeLowongan(hasil.data, gambarData);
  console.info(LOG, 'analisis lowongan: temuan', {
    tingkat: data.tingkat_perhatian,
    dariAi: diagnosis.dariAi,
    dariAturan: diagnosis.dariAturan,
    dibuang: diagnosis.dibuang,
  });

  return { ...data, sumber: 'ai' };
}

// ── Latihan negosiasi: versi dari master, tidak diubah ──

export async function balasSebagaiHrd(
  apiKey: string,
  lowongan: LowonganData | null,
  tawaran: TawaranData | null,
  messages: PesanLatihan[]
): Promise<string> {
  if (!apiKey.trim()) {
    throw new Error('Kunci API belum diisi.');
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL_ANALISIS_LOWONGAN,
      temperature: 0.6,
      max_tokens: 220,
      messages: [
        {
          role: 'system',
          content: buatPromptHrd(lowongan, tawaran),
        },
        ...buatPesanPercakapan(messages),
      ],
    }),
  });

  const result = (await response.json()) as GroqResponse;
  if (!response.ok) {
    throw new Error(result.error?.message ?? 'Permintaan balasan HRD gagal.');
  }

  // Buang blok penalaran (<think>…</think>) dan label "HRD:" jika model menyertakannya
  const content = result.choices?.[0]?.message?.content
    ?.replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^\s*HRD\s*:\s*/i, '')
    .trim();
  if (!content) {
    throw new Error('API Groq tidak mengembalikan balasan HRD.');
  }

  return content;
}

export async function evaluasiLatihan(
  apiKey: string,
  messages: PesanLatihan[],
  lowongan: LowonganData | null = null,
  tawaran: TawaranData | null = null
): Promise<EvaluasiLatihan> {
  if (!apiKey.trim()) {
    throw new Error('Kunci API belum diisi.');
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL_ANALISIS_LOWONGAN,
      temperature: 0.2,
      max_tokens: 600,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: buatPromptEvaluasiLatihan(messages, lowongan, tawaran),
        },
        {
          role: 'user',
          content: 'Evaluasi percakapan tersebut sesuai rubrik dan format JSON.',
        },
      ],
    }),
  });

  const result = (await response.json()) as GroqResponse;
  if (!response.ok) {
    throw new Error(result.error?.message ?? 'Permintaan evaluasi gagal.');
  }

  const content = result.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('API Groq tidak mengembalikan evaluasi.');
  }

  const parsed = AiEvaluasiLatihanSchema.parse(ambilJson(content));
  const totalSkor =
    parsed.skor_kejelasan + parsed.skor_alasan + parsed.skor_kesopanan;

  return {
    ...parsed,
    total_skor: totalSkor,
    maksimal_skor: 15,
  };
}

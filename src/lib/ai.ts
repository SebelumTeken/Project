import { buatDataLowongan } from './validasi';
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
const MODEL_ANALISIS_LOWONGAN = 'qwen/qwen3.8-27b';

interface GroqResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
}

function ambilDataGambar(gambarData: string): {
  mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  base64: string;
} {
  const match = gambarData.match(/^data:(image\/(?:jpeg|png|gif|webp));base64,(.+)$/);
  if (!match) {
    throw new Error('Format gambar tidak didukung untuk analisis AI.');
  }

  return {
    mediaType: match[1] as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
    base64: match[2],
  };
}

function ambilJson(teks: string): unknown {
  const fenced = teks.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const kandidat = fenced?.[1] ?? teks;
  const mulai = kandidat.indexOf('{');
  const selesai = kandidat.lastIndexOf('}');

  if (mulai === -1 || selesai <= mulai) {
    throw new Error('Respons AI tidak berisi JSON yang dapat dibaca.');
  }

  try {
    return JSON.parse(kandidat.slice(mulai, selesai + 1));
  } catch {
    throw new Error('Respons AI menghasilkan JSON yang tidak valid.');
  }
}

export async function analisisLowongan(
  apiKey: string,
  gambarData: string
) {
  if (!apiKey.trim()) {
    throw new Error('Kunci API belum diisi.');
  }

  const image = ambilDataGambar(gambarData);
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL_ANALISIS_LOWONGAN,
      temperature: 0,
      max_tokens: 1400,
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
              image_url: {
                url: `data:${image.mediaType};base64,${image.base64}`,
              },
            },
            {
              type: 'text',
              text: 'Analisis poster lowongan ini sesuai format JSON yang diminta.',
            },
          ],
        },
      ],
    }),
  });

  const result = (await response.json()) as GroqResponse;
  if (!response.ok) {
    throw new Error(result.error?.message ?? 'Permintaan ke API Groq gagal.');
  }

  const content = result.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('API Groq tidak mengembalikan hasil analisis.');
  }

  const parsed = AiLowonganAnalysisSchema.parse(ambilJson(content));
  return buatDataLowongan(parsed, gambarData);
}

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

  const content = result.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('API Groq tidak mengembalikan balasan HRD.');
  }

  return content;
}

export async function evaluasiLatihan(
  apiKey: string,
  messages: PesanLatihan[]
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
      max_tokens: 400,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: buatPromptEvaluasiLatihan(messages),
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

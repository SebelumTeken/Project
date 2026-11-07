import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AiDibatalkanError,
  ambilJson,
  analisisLowongan,
  BATAS_WAKTU_MS,
  MODEL_GROQ,
  normalisasiAnalisis,
  pesanErrorHttp,
} from './ai';

const GAMBAR = 'data:image/jpeg;base64,AAAA';

function responsGroq(content: string, finishReason = 'stop', status = 200) {
  return new Response(
    JSON.stringify({ choices: [{ finish_reason: finishReason, message: { content } }] }),
    { status }
  );
}

const ANALISIS_VALID = {
  teks_terbaca: 'Dicari Admin. Biaya seragam Rp150.000. Daftar via WhatsApp.',
  nama_perusahaan: null,
  posisi: 'Admin',
  lokasi: null,
  gaji_tertulis: 'Rp8.000.000',
  kontak: 'WhatsApp',
  ringkasan: 'Ada permintaan biaya.',
  temuan: [
    {
      kode_tanda: 'biaya_di_awal',
      kutipan: 'Biaya seragam Rp150.000',
      penjelasan: 'Perlu diperiksa.',
    },
  ],
};

describe('ambilJson', () => {
  it('membaca JSON yang diawali blok berpikir dan dibungkus markdown', () => {
    const teks = '<think>analisis dulu {bukan json}</think>\n```json\n{"a": 1}\n```';
    expect(ambilJson(teks)).toEqual({ a: 1 });
  });

  it('memberi pesan jelas jika tidak ada JSON', () => {
    expect(() => ambilJson('maaf, saya tidak bisa')).toThrow(/tidak berisi JSON/);
  });
});

describe('normalisasiAnalisis', () => {
  it('mengubah gaji teks menjadi angka dan melengkapi kolom kosong', () => {
    expect(normalisasiAnalisis({ teks_terbaca: 'x', gaji_tertulis: 'Rp8.000.000' })).toEqual({
      teks_terbaca: 'x',
      gaji_tertulis: 8000000,
      temuan: [],
      nama_perusahaan: null,
      posisi: null,
      lokasi: null,
      kontak: null,
      ringkasan: '',
    });
  });
});

describe('pesanErrorHttp', () => {
  it('membedakan kunci salah, rate limit, dan server error', () => {
    expect(pesanErrorHttp(401)).toMatch(/Kunci API Groq ditolak/);
    expect(pesanErrorHttp(429)).toMatch(/Batas pemakaian Groq/);
    expect(pesanErrorHttp(503)).toMatch(/Server Groq sedang bermasalah/);
  });
});

describe('analisisLowongan', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('mengirim model Groq dengan reasoning dimatikan dan menandai hasil sebagai AI', async () => {
    fetchMock.mockResolvedValue(responsGroq(JSON.stringify(ANALISIS_VALID)));

    const hasil = await analisisLowongan('kunci-uji', GAMBAR);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.model).toBe(MODEL_GROQ);
    expect(body.reasoning_effort).toBe('none');
    expect(body.response_format).toEqual({ type: 'json_object' });

    expect(hasil.sumber).toBe('ai');
    expect(hasil.gaji_tertulis).toBe(8000000);
    expect(hasil.temuan).toHaveLength(1);
    expect(hasil.tingkat_perhatian).toBe('tinggi');
  });

  it('menampilkan pesan kunci salah untuk HTTP 401', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'Invalid API Key' } }), { status: 401 })
    );

    await expect(analisisLowongan('kunci-salah', GAMBAR)).rejects.toThrow(
      /Kunci API Groq ditolak \(HTTP 401\).*Invalid API Key/
    );
  });

  it('berhenti dengan pesan jelas jika Groq tidak merespons', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError'))
          );
        })
    );

    const hasil = expect(analisisLowongan('kunci-uji', GAMBAR)).rejects.toThrow(
      /tidak merespons dalam 45 detik/
    );
    await vi.advanceTimersByTimeAsync(BATAS_WAKTU_MS.analisisLowongan);
    await hasil;
  });

  it('melempar AiDibatalkanError saat dibatalkan pengguna', async () => {
    const controller = new AbortController();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError'))
          );
        })
    );

    const hasil = analisisLowongan('kunci-uji', GAMBAR, { signal: controller.signal });
    controller.abort();
    await expect(hasil).rejects.toBeInstanceOf(AiDibatalkanError);
  });

  it('menolak jawaban yang terpotong', async () => {
    fetchMock.mockResolvedValue(responsGroq('{"teks_terbaca": "Dicari', 'length'));

    await expect(analisisLowongan('kunci-uji', GAMBAR)).rejects.toThrow(/terpotong/);
  });

  it('menyebut kolom yang tidak sesuai kontrak', async () => {
    fetchMock.mockResolvedValue(
      responsGroq(JSON.stringify({ ...ANALISIS_VALID, teks_terbaca: 123 }))
    );

    await expect(analisisLowongan('kunci-uji', GAMBAR)).rejects.toThrow(/kolom: teks_terbaca/);
  });
});

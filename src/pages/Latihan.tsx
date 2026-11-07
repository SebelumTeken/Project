import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { Button } from '../components/Button';
import { TextLink } from '../components/TextLink';
import { useSession } from '../store/session';
import { PesanLatihan } from '../types';
import { balasSebagaiHrd, evaluasiLatihan } from '../lib/ai';
import {
  balasHrdAturan,
  buatKonteksLatihan,
  buatPembuka,
  buatSaranArgumen,
  evaluasiAturan,
  rupiah,
} from '../lib/latihan';

const MAX_USER_REPLIES = 6;

export const Latihan: React.FC = () => {
  const navigate = useNavigate();
  const {
    mode,
    apiKey,
    lowongan,
    tawaran,
    pesanLatihan,
    setPesanLatihan,
    setEvaluasi,
  } = useSession();

  const pakaiAi = mode === 'ai' && apiKey.trim().length > 0;
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Konteks dari Cek Lowongan + Cek Tawaran (null jika tawaran belum diisi)
  const ctx = useMemo(
    () => (tawaran ? buatKonteksLatihan(lowongan, tawaran) : null),
    [lowongan, tawaran]
  );

  // Lanjutkan percakapan tersimpan, atau mulai dari pembuka berdasarkan tawaran asli
  const [messages, setMessages] = useState<PesanLatihan[]>(() => {
    if (pesanLatihan && pesanLatihan.length > 0) return pesanLatihan;
    return ctx ? [buatPembuka(ctx)] : [];
  });

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  const userRepliesCount = messages.filter((m) => m.pengirim === 'pengguna').length;
  const isLimitReached = userRepliesCount >= MAX_USER_REPLIES;

  // Simpan progres agar tidak hilang saat berpindah halaman
  useEffect(() => {
    if (messages.length > 0) setPesanLatihan(messages);
  }, [messages, setPesanLatihan]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Belum mengisi Cek Tawaran: arahkan ke sana, jangan pakai data contoh
  if (!ctx) {
    return (
      <AppLayout stepText="3 dari 3">
        <div className="w-full flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-10 py-16">
          <h1 className="font-semibold text-[28px] sm:text-[40px] leading-tight tracking-[-0.8px] text-text">
            Isi tawaranmu dulu.
          </h1>
          <p className="mt-3 max-w-[440px] text-[16px] sm:text-[17px] leading-7 text-secondary">
            Latihan negosiasi memakai nominal dan konteks dari halaman Cek Tawaran.
          </p>
          <div className="mt-8">
            <Button to="/tawaran">Cek tawaran</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const positionTitle = ctx.posisi.toUpperCase();
  const salaryText = `${rupiah(ctx.gaji).toUpperCase()} ${ctx.labelSatuan.toUpperCase()}`;
  const saranArgumen = buatSaranArgumen(ctx, messages);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputMessage.trim();
    if (!trimmed || isLimitReached || isTyping) return;

    const newUserMsg: PesanLatihan = {
      id: `u-${Date.now()}`,
      pengirim: 'pengguna',
      isi: trimmed,
    };

    const updated = [...messages, newUserMsg];
    setMessages(updated);
    setInputMessage('');
    setErrorMessage('');

    setIsTyping(true);
    try {
      const hrdReplyText = pakaiAi
        ? await balasSebagaiHrd(apiKey, lowongan, tawaran, updated)
        : await new Promise<string>((resolve) => {
            setTimeout(() => resolve(balasHrdAturan(ctx, updated)), 650);
          });

      const newHrdMsg: PesanLatihan = {
        id: `h-${Date.now()}`,
        pengirim: 'hrd',
        isi: hrdReplyText,
      };

      setMessages((prev) => [...prev, newHrdMsg]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Balasan HRD tidak dapat dimuat. Coba lagi.'
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleSelesai = async () => {
    if (isTyping || isEvaluating || userRepliesCount === 0) return;

    setErrorMessage('');
    setPesanLatihan(messages);

    if (pakaiAi) {
      setIsEvaluating(true);
      try {
        const hasilEvaluasi = await evaluasiLatihan(apiKey, messages, lowongan, tawaran);
        setEvaluasi(hasilEvaluasi);
        navigate('/latihan/hasil');
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Evaluasi latihan tidak dapat dimuat. Coba lagi.'
        );
      } finally {
        setIsEvaluating(false);
      }
      return;
    }

    setEvaluasi(evaluasiAturan(ctx, messages));
    navigate('/latihan/hasil');
  };

  const handleMulaiUlang = () => {
    if (isTyping || isEvaluating) return;
    setErrorMessage('');
    setEvaluasi(null);
    setMessages([buatPembuka(ctx)]);
  };

  return (
    <AppLayout stepText="3 dari 3">
      {/* Sub-Header Context Bar */}
      <div className="w-full bg-background border-b border-divider/20">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-10 py-3 sm:py-4 flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-[12px] leading-4 tracking-[0.6px] uppercase px-3 py-1 bg-surface rounded-full text-text select-none">
              LATIHAN
            </span>
            <span className="font-semibold text-[12px] leading-4 tracking-[1.2px] uppercase text-secondary select-none whitespace-nowrap">
              3 DARI 3
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Replies counter badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-surface rounded-full text-xs font-semibold">
              <span className="text-accent-strong select-none">
                {userRepliesCount}/{MAX_USER_REPLIES}
              </span>
              <span className="hidden sm:inline text-secondary tracking-[0.48px] uppercase select-none">
                BALASAN
              </span>
            </div>
            <TextLink to="/tawaran/hasil" className="text-sm font-normal text-nav">
              Kembali
            </TextLink>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full flex-1 flex flex-col items-center px-4 sm:px-10 pt-10 pb-20">
        <div className="w-full max-w-[720px] flex flex-col items-center">
          {/* Editorial Simulation Header & Context */}
          <section className="w-full flex flex-col items-center text-center mb-10">
            {/* Pill context */}
            <div className="inline-flex items-center gap-1.5 px-4 py-1 bg-surface rounded-full mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" aria-hidden="true" />
              <span className="font-semibold text-[12px] leading-4 tracking-[1.2px] uppercase text-secondary">
                SIMULASI NEGOSIASI
              </span>
            </div>

            {/* Sub-context (Position & Salary) */}
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-secondary tracking-[0.3px] uppercase mb-2">
              <span>{positionTitle}</span>
              <span>·</span>
              <span>{salaryText}</span>
            </div>

            {/* Title */}
            <h1 className="font-semibold text-[28px] leading-[34px] tracking-[-0.7px] text-text mb-2">
              Latih percakapanmu.
            </h1>

            {/* Subtitle */}
            <p className="max-w-[520px] font-normal text-[14px] leading-5 text-secondary">
              Uji argumen dan cara penyampaianmu sebelum berbicara langsung dengan perekrut.
            </p>
            <p className="mt-2 text-[12px] leading-4 text-secondary">
              {pakaiAi
                ? 'HRD dijalankan AI berdasarkan tawaranmu.'
                : 'Mode tanpa AI: balasan HRD mengikuti aturan. Isi kunci API di Pengaturan untuk HRD berbasis AI.'}
            </p>
          </section>

          {/* Tranquil Conversation Flow */}
          <div className="w-full flex flex-col gap-6 mb-8">
            {messages.map((item) => {
              const isHrd = item.pengirim === 'hrd';

              return (
                <div
                  key={item.id}
                  className={`w-full flex flex-col ${
                    isHrd ? 'items-start' : 'items-end'
                  }`}
                >
                  {/* Sender Label */}
                  <span
                    className={`font-semibold text-[12px] leading-4 tracking-[0.6px] uppercase text-secondary mb-1 ${
                      isHrd ? 'pl-4' : 'pr-4'
                    }`}
                  >
                    {isHrd ? 'HRD' : 'KAMU'}
                  </span>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[88%] sm:max-w-[560px] py-3.5 px-5 sm:py-5 sm:px-10 text-[16px] sm:text-[17px] leading-7 tracking-[-0.051px] ${
                      isHrd
                        ? 'bg-surface text-text rounded-[24px] rounded-bl-[2px]'
                        : 'bg-accent text-background rounded-[24px] rounded-br-[2px] shadow-sm'
                    }`}
                  >
                    {item.isi}
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {isTyping && (
              <div className="w-full flex flex-col items-start">
                <span className="font-semibold text-[12px] leading-4 tracking-[0.6px] uppercase text-secondary mb-1 pl-4">
                  HRD
                </span>
                <div className="bg-surface text-secondary py-4 px-6 rounded-[24px] rounded-bl-[2px] text-sm flex items-center gap-1.5">
                  <span className="animate-pulse">Sedang mengetik</span>
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce delay-100">.</span>
                  <span className="animate-bounce delay-200">.</span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Live Guiding Prompt / Feedback Slate */}
          <div className="w-full bg-background border border-divider/40 rounded-[24px] sm:rounded-[32px] p-4 sm:p-6 mb-6 sm:mb-8 flex items-start gap-3 sm:gap-4 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center shrink-0 text-accent-strong">
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="8" cy="8" r="6.5" />
                <path d="M8 5v3.5" />
                <circle cx="8" cy="11" r="0.5" fill="currentColor" />
              </svg>
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-semibold text-[12px] leading-4 tracking-[0.6px] uppercase text-secondary">
                SARAN ARGUMEN
              </span>
              <p className="font-normal text-[14px] leading-[21px] text-text">
                {saranArgumen}
              </p>
            </div>
          </div>

          {/* Bottom Tranquil Input & Controls */}
          <div className="w-full flex flex-col items-center">
            {errorMessage && (
              <p className="mb-4 text-center text-sm text-danger" role="alert">
                {errorMessage}
              </p>
            )}

            {/* Capsule Input */}
            <form
              onSubmit={handleSendMessage}
              className="w-full h-14 sm:h-16 bg-surface rounded-full relative flex items-center pr-1.5 sm:pr-2 pl-5 sm:pl-6"
            >
              <input
                type="text"
                value={inputMessage}
                disabled={isLimitReached || isTyping}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  isLimitReached
                    ? 'Batas 6 balasan tercapai. Klik Selesai di bawah.'
                    : 'Tulis jawaban...'
                }
                className="w-full bg-transparent font-normal text-[16px] sm:text-[17px] leading-[21px] text-text placeholder-secondary focus:outline-none pr-2 min-w-0 disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || isLimitReached || isTyping}
                title="Kirim balasan"
                aria-label="Kirim balasan"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-accent hover:bg-accent-strong active:bg-accent-strong text-background flex items-center justify-center shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-4 h-4 text-background"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="8" y1="12" x2="8" y2="4" />
                  <polyline points="4 8 8 4 12 8" />
                </svg>
              </button>
            </form>

            {/* Actions below Input */}
            <div className="mt-4 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleSelesai}
                disabled={isTyping || isEvaluating || userRepliesCount === 0}
                className="inline-flex items-center gap-1 font-medium text-[17px] leading-[22px] tracking-[-0.085px] text-accent hover:text-accent-strong transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>{isEvaluating ? 'Menilai...' : 'Selesai'}</span>
                <span className="select-none" aria-hidden="true">
                  ›
                </span>
              </button>

              <p className="font-normal text-[14px] leading-5 text-secondary text-center">
                {userRepliesCount === 0
                  ? 'Kirim minimal satu balasan sebelum menyelesaikan latihan.'
                  : 'Maksimal 6 balasan. Latihan dapat diselesaikan kapan saja.'}
              </p>

              {userRepliesCount > 0 && (
                <button
                  type="button"
                  onClick={handleMulaiUlang}
                  disabled={isTyping || isEvaluating}
                  className="text-[14px] leading-5 text-secondary hover:text-text transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm disabled:opacity-40"
                >
                  Mulai ulang percakapan
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

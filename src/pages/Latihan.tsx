import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { TextLink } from '../components/TextLink';
import { useSession } from '../store/session';
import { PesanLatihan } from '../types';

const MAX_USER_REPLIES = 6;

const DEMO_HRD_REPLIES = [
  'Apa alasan kamu?',
  'Kualifikasi kamu menarik, tetapi anggaran divisi kami saat ini ditetapkan di angka tersebut. Apakah ada kompensasi non-finansial yang bisa dipertimbangkan?',
  'Kami bisa mengajukan peninjauan ulang performa setelah masa probation 3 bulan. Bagaimana menurutmu?',
  'Jika beban kerja mencakup akhir pekan, kami dapat menambahkan tunjangan operasional harian. Apakah ini cukup sesuai?',
  'Ini adalah penawaran batas atas yang dapat kami berikan untuk posisi ini saat ini. Bagaimana keputusanmu?',
  'Terima kasih telah berdiskusi secara terbuka. Kami akan mempertimbangkan poin-poin yang kamu sampaikan.',
];

export const Latihan: React.FC = () => {
  const navigate = useNavigate();
  const { lowongan, tawaran, pesanLatihan, setPesanLatihan, loadDemoData } =
    useSession();

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Initialize with initial conversation if empty
  const [messages, setMessages] = useState<PesanLatihan[]>(() => {
    if (pesanLatihan && pesanLatihan.length > 0) {
      return pesanLatihan;
    }
    return [
      {
        id: 'm1',
        pengirim: 'hrd',
        isi: 'Kami menawarkan Rp2.800.000. Bagaimana?',
      },
      {
        id: 'm2',
        pengirim: 'pengguna',
        isi: 'Apakah masih bisa dibicarakan?',
      },
      {
        id: 'm3',
        pengirim: 'hrd',
        isi: 'Apa alasan kamu?',
      },
    ];
  });

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // Count how many replies user has sent
  const userRepliesCount = messages.filter((m) => m.pengirim === 'pengguna').length;
  const isLimitReached = userRepliesCount >= MAX_USER_REPLIES;

  const positionTitle =
    lowongan?.posisi?.toUpperCase() ?? 'ADMIN TOKO ONLINE';
  const salaryText = tawaran?.gaji_bulanan
    ? `RP${tawaran.gaji_bulanan.toLocaleString('id-ID')} / BULAN`
    : 'RP2.800.000 / BULAN';

  useEffect(() => {
    if (!lowongan || !tawaran) {
      loadDemoData();
    }
  }, [lowongan, tawaran, loadDemoData]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = (e?: React.FormEvent) => {
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

    // Check if limit reached with this new message
    const currentReplies = updated.filter((m) => m.pengirim === 'pengguna').length;

    // Trigger HRD response
    setIsTyping(true);
    setTimeout(() => {
      // Pick next reply based on reply index
      const replyIdx = Math.min(currentReplies, DEMO_HRD_REPLIES.length - 1);
      const hrdReplyText = DEMO_HRD_REPLIES[replyIdx];

      const newHrdMsg: PesanLatihan = {
        id: `h-${Date.now()}`,
        pengirim: 'hrd',
        isi: hrdReplyText,
      };

      setMessages((prev) => [...prev, newHrdMsg]);
      setIsTyping(false);
    }, 650);
  };

  const handleSelesai = () => {
    // Save conversation to session state
    setPesanLatihan(messages);
    navigate('/latihan/hasil');
  };

  return (
    <AppLayout stepText="3 dari 3" isDemo>
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
                Gunakan rujukan UMK domisili kerja (Kepgub terkini), beban
                operasional 6 hari kerja, atau portofolio pengelolaan
                marketplace serupa untuk menjaga posisi tetap profesional dan
                terukur.
              </p>
            </div>
          </div>

          {/* Bottom Tranquil Input & Controls */}
          <div className="w-full flex flex-col items-center">
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
                className="inline-flex items-center gap-1 font-medium text-[17px] leading-[22px] tracking-[-0.085px] text-accent hover:text-accent-strong transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
              >
                <span>Selesai</span>
                <span className="select-none" aria-hidden="true">
                  ›
                </span>
              </button>

              <p className="font-normal text-[14px] leading-5 text-secondary text-center">
                Maksimal 6 balasan. Latihan dapat diselesaikan kapan saja.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useSession } from '../store/session';

export const Pengaturan: React.FC = () => {
  const navigate = useNavigate();
  const { mode, setMode, apiKey, setApiKey, resetSession } = useSession();

  // Local draft state — only committed on "Simpan"
  const [draftKey, setDraftKey] = useState<string>(apiKey);
  const [showKey, setShowKey] = useState<boolean>(false);

  const handleSimpan = () => {
    // Tanpa pilihan mode: AI dipakai otomatis jika kunci API diisi,
    // jika kosong aplikasi memakai data contoh.
    const modeBaru = draftKey.trim() ? 'ai' : 'contoh';
    if (modeBaru !== mode) {
      // Data dari mode sebelumnya dikosongkan supaya data contoh
      // tidak terbawa ke Mode AI, dan sebaliknya.
      resetSession();
    }
    setMode(modeBaru);
    setApiKey(draftKey);
    // Navigate back after saving
    navigate(-1);
  };

  const handleHapusKunci = () => {
    setDraftKey('');
  };

  // Status: aktif jika kunci API sudah diisi
  const isActive = draftKey.trim().length > 0;

  return (
    <AppLayout>
      {/* ── Custom Header for Pengaturan page ── */}
      {/* Override: rendered inside AppLayout's main, we need a back-link header.
          The shared Header already renders; we add a sub-bar below it with the
          back link so we don't duplicate the sticky header structure. */}
      <div className="w-full bg-background border-b border-divider/20">
        <div className="max-w-[1120px] mx-auto px-4 sm:px-10 h-11 flex items-center gap-6 text-sm">
          <Link
            to="/"
            className="font-medium text-[17px] leading-[22px] tracking-[-0.085px] text-nav hover:text-text transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
          >
            ‹ Kembali
          </Link>
        </div>
      </div>

      {/* Main */}
      <div className="w-full flex-1 flex flex-col items-center px-4 sm:px-10 pt-10 sm:pt-16 pb-20 bg-[#F9F9FB]">
        <div className="w-full max-w-[1040px] flex flex-col items-center">

          {/* Centered Editorial Header */}
          <header className="w-full max-w-[640px] flex flex-col items-center text-center mb-10 sm:mb-16 gap-3 px-0 sm:px-5">
            <span className="font-semibold text-[12px] leading-4 tracking-[1.2px] uppercase text-nav">
              PENGATURAN
            </span>
            <h1 className="font-semibold text-4xl sm:text-[48px] leading-tight sm:leading-[52px] tracking-[-1.2px] text-text">
              Pengaturan
            </h1>
            <p className="font-normal text-[14px] leading-5 text-nav max-w-[420px]">
              Masukkan kunci API Groq agar poster lowongan dianalisis dengan AI.
            </p>
          </header>

          {/* Settings Form Column */}
          <div className="w-full max-w-[560px] flex flex-col gap-8 sm:gap-10 px-0 sm:px-5">

            {/* ── Section 2: API Key Password Input ── */}
            <section aria-labelledby="apikey-label">
              <div className="flex items-center justify-between mb-2.5">
                <label
                  id="apikey-label"
                  htmlFor="api-key-input"
                  className="font-normal text-[14px] leading-5 text-nav"
                >
                  Kunci API Groq
                </label>
                <span className="font-normal text-[12px] leading-4 text-nav">
                  Hanya di sesi ini
                </span>
              </div>

              {/* Input wrapper */}
              <div className="relative w-full">
                <input
                  id="api-key-input"
                  type={showKey ? 'text' : 'password'}
                  value={draftKey}
                  onChange={(e) => setDraftKey(e.target.value)}
                  placeholder="Masukkan kunci API…"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full h-14 pl-5 pr-14 bg-surface font-normal text-[16px] leading-[19px] tracking-[-0.051px] text-text placeholder-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-none"
                  // Key stored only in memory — never in localStorage or env files
                />
                {/* Show / hide toggle */}
                <button
                  type="button"
                  aria-label={showKey ? 'Sembunyikan kunci' : 'Tampilkan kunci'}
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-nav hover:text-text transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {/* Eye icon (SVG, no extra library) */}
                  {showKey ? (
                    <svg width="18" height="17" viewBox="0 0 18 17" fill="none" aria-hidden="true">
                      <path d="M1 1l16 15M7.5 7.9A1.5 1.5 0 009.6 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M4.4 4.9C2.6 6 1.3 7.5 1 8.5c.8 2.5 4 5 8 5 1.5 0 2.9-.4 4.1-1.1M7 2.7C7.6 2.6 8.3 2.5 9 2.5c4 0 7.2 2.5 8 5-.3 1-1 2-2 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="18" height="12" viewBox="0 0 18 12" fill="none" aria-hidden="true">
                      <path d="M1 6C1.8 3.5 5 1 9 1s7.2 2.5 8 5c-.8 2.5-4 5-8 5S1.8 8.5 1 6z" stroke="currentColor" strokeWidth="1.5"/>
                      <circle cx="9" cy="6" r="2" stroke="currentColor" strokeWidth="1.5"/>
                    </svg>
                  )}
                </button>
              </div>

              {/* Helper row */}
              <div className="mt-1 flex items-center justify-between">
                <p className="font-normal text-[12px] leading-4 text-nav">
                  Kunci tidak disimpan ke disk atau dikirim ke server kami.
                </p>
                {draftKey.length > 0 && (
                  <button
                    type="button"
                    onClick={handleHapusKunci}
                    className="font-normal text-[12px] leading-4 text-accent-strong hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
                  >
                    Hapus kunci
                  </button>
                )}
              </div>
            </section>

            {/* ── Section 3: Status Row ── */}
            <section
              aria-label="Status koneksi"
              className="flex items-center justify-between w-full px-5 py-5 bg-surface/60 rounded-none"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-normal text-[14px] leading-5 text-nav">
                  Koneksi
                </span>
                <span className="font-semibold text-[12px] leading-4 tracking-[0.6px] uppercase text-nav">
                  PROTOKOL HTTPS
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-success' : 'bg-secondary'}`}
                  aria-hidden="true"
                />
                <span className="font-medium text-[14px] leading-5 tracking-[-0.07px] text-text">
                  {isActive ? 'Aktif' : 'Tidak aktif'}
                </span>
              </div>
            </section>

            {/* ── Section 4: Actions Row ── */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-4 w-full pt-2">
              {/* Test connection link */}
              <button
                type="button"
                disabled={!isActive}
                className="flex items-center justify-center gap-1.5 font-medium text-[14px] leading-5 tracking-[-0.07px] text-accent-strong hover:underline disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
                // TODO(ai): trigger real API connectivity test
              >
                Uji koneksi
                <span className="text-[16px] leading-4" aria-hidden="true">›</span>
              </button>

              {/* Save button */}
              <button
                type="button"
                onClick={handleSimpan}
                className="inline-flex items-center justify-center h-12 px-8 bg-accent text-background font-medium text-[17px] leading-[22px] tracking-[-0.085px] rounded-full shadow-[0_1px_4px_rgba(0,102,204,0.15)] hover:bg-accent-strong active:bg-accent-strong transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
              >
                Simpan
              </button>
            </div>

            {/* ── Supplemental Informational Note ── */}
            <div className="w-full pt-6">
              <div className="border-t border-[#E8E8EA] pt-2 flex items-start gap-3">
                {/* Info icon placeholder */}
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                  className="shrink-0 mt-0.5 text-nav"
                >
                  <circle cx="6" cy="6" r="5.25" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M6 5.5v3M6 4h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <p className="font-normal text-[12px] leading-5 text-nav">
                  Kunci API hanya tersimpan di memori selama sesi ini. Saat tab atau browser ditutup, kunci akan hilang. Semua permintaan AI dikirim langsung dari browser ke endpoint resmi penyedia, tidak melalui server SebelumTeken.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </AppLayout>
  );
};

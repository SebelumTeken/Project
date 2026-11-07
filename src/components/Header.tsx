import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

interface HeaderProps {
  stepText?: string;
  isDemo?: boolean;
}

const NAV_ITEMS = [
  { to: '/lowongan', label: 'Lowongan' },
  { to: '/tawaran', label: 'Tawaran' },
  { to: '/latihan', label: 'Latihan' },
];

// Tautan ke bagian landing page di Beranda
const HOME_ITEMS = [
  { to: '/#tentang', label: 'Tentang' },
  { to: '/#cara-kerja', label: 'Cara Kerja' },
  { to: '/#fitur', label: 'Fitur' },
];

export const Header: React.FC<HeaderProps> = ({ stepText, isDemo }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [menuOpen, setMenuOpen] = useState(false);

  // Tutup menu setiap kali pindah halaman atau pindah bagian
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  // Tutup menu dengan tombol Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
    `transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm px-1 py-0.5 ${
      isActive ? 'text-text font-medium' : 'hover:text-text'
    }`;

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between h-12 px-4 rounded-2xl text-[17px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
      isActive ? 'bg-surface text-text font-medium' : 'text-nav hover:bg-surface'
    }`;

  return (
    <header className="sticky top-0 z-50 w-full bg-background/90 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="max-w-[1120px] mx-auto h-14 px-4 sm:px-10 flex items-center justify-between gap-3">
        {/* Brand */}
        <Link
          to="/"
          aria-label="SebelumTeken, ke Beranda"
          className="flex items-center shrink-0 hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md select-none"
        >
          {/* Wordmark (gambar punya ruang kosong, jadi dipotong lewat object-cover) */}
          <span className="block w-[124px] h-[28px] sm:w-[150px] sm:h-[34px] overflow-hidden">
            <img
              src="/images/diNavbar.png"
              alt="SebelumTeken"
              className="w-full h-full object-cover"
            />
          </span>
        </Link>

        {/* Center: Step Indicator */}
        {stepText && (
          <div className="hidden md:block text-sm font-medium text-secondary truncate">
            {stepText}
          </div>
        )}

        {/* Right Section */}
        <div className="flex items-center gap-3 sm:gap-6">
          <nav className="hidden md:flex items-center gap-4 text-sm leading-5 text-nav">
            {isHome
              ? HOME_ITEMS.map((item) => (
                  <Link key={item.to} to={item.to} className={desktopLinkClass({ isActive: false })}>
                    {item.label}
                  </Link>
                ))
              : NAV_ITEMS.map((item) => (
                  <NavLink key={item.to} to={item.to} className={desktopLinkClass}>
                    {item.label}
                  </NavLink>
                ))}
          </nav>

          {isDemo && (
            <span className="hidden sm:inline text-xs font-medium text-secondary select-none">
              Data contoh
            </span>
          )}

          {/* Settings Button */}
          <Link
            to="/pengaturan"
            title="Pengaturan"
            aria-label="Pengaturan"
            className="w-9 h-9 shrink-0 rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.12)] hover:opacity-90 active:scale-95 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent select-none"
          >
            <img
              src="/images/untukNavbar.png"
              alt=""
              width={36}
              height={36}
              className="w-full h-full object-cover"
            />
          </Link>

          {/* Hamburger (mobile & tablet) */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={menuOpen}
            aria-controls="menu-mobile"
            className="md:hidden w-10 h-10 -mr-2 flex items-center justify-center rounded-full text-text hover:bg-surface transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              aria-hidden="true"
            >
              {menuOpen ? (
                <>
                  <line x1="5" y1="5" x2="15" y2="15" />
                  <line x1="15" y1="5" x2="5" y2="15" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="17" y2="6" />
                  <line x1="3" y1="10" x2="17" y2="10" />
                  <line x1="3" y1="14" x2="17" y2="14" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {menuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 top-14 bg-text/20"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <nav
            id="menu-mobile"
            className="md:hidden absolute left-0 right-0 top-14 bg-background border-t border-divider/40 shadow-[0_8px_24px_rgba(0,0,0,0.08)] px-4 pt-3 pb-5"
          >
            {stepText && (
              <p className="px-4 pb-2 text-xs font-semibold tracking-[0.6px] uppercase text-secondary">
                Langkah {stepText}
                {isDemo ? ' · Data contoh' : ''}
              </p>
            )}
            <div className="flex flex-col gap-1">
              <NavLink to="/" end className={mobileLinkClass}>
                Beranda
              </NavLink>
              {isHome &&
                HOME_ITEMS.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className={`${mobileLinkClass({ isActive: false })} pl-8 text-[15px]`}
                  >
                    {item.label}
                  </Link>
                ))}
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} className={mobileLinkClass}>
                  {item.label}
                  <span aria-hidden="true" className="text-secondary">›</span>
                </NavLink>
              ))}
              <NavLink to="/pengaturan" className={mobileLinkClass}>
                Pengaturan
                <span aria-hidden="true" className="text-secondary">›</span>
              </NavLink>
            </div>
          </nav>
        </>
      )}
    </header>
  );
};

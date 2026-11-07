import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  stepText?: string;
  isDemo?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ stepText, isDemo }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className="sticky top-0 z-50 w-full bg-background/90 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="max-w-[1120px] mx-auto h-14 px-4 sm:px-10 flex items-center justify-between">
        {/* Brand Wordmark */}
        <Link
          to="/"
          className="font-semibold text-[22px] leading-[22px] tracking-[-0.425px] text-text hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm select-none"
        >
          SebelumTeken
        </Link>

        {/* Center: Step Indicator (for internal screens) */}
        {stepText && (
          <div className="hidden sm:block text-sm font-medium text-secondary">
            {stepText}
          </div>
        )}

        {/* Right Section: Nav & Settings Button */}
        <div className="flex items-center gap-6">
          {/* Navigation links (shown on Beranda or desktop) */}
          {isHome ? (
            <nav className="hidden md:flex items-center gap-4 text-sm leading-5 text-nav">
              <Link
                to="/lowongan"
                className="hover:text-text transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm px-1 py-0.5"
              >
                Lowongan
              </Link>
              <Link
                to="/tawaran"
                className="hover:text-text transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm px-1 py-0.5"
              >
                Tawaran
              </Link>
              <Link
                to="/latihan"
                className="hover:text-text transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm px-1 py-0.5"
              >
                Latihan
              </Link>
            </nav>
          ) : isDemo ? (
            <span className="text-xs font-medium text-secondary select-none">
              Data contoh
            </span>
          ) : null}

          {/* Settings Button */}
          <Link
            to="/pengaturan"
            title="Pengaturan"
            aria-label="Pengaturan"
            className="w-8 h-8 rounded-full bg-accent-strong flex items-center justify-center text-background hover:opacity-90 active:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent select-none"
          >
            {/* 12px Icon */}
            <svg
              className="w-3 h-3 text-background fill-current"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8 4.75a3.25 3.25 0 100 6.5 3.25 3.25 0 000-6.5zM6.25 8a1.75 1.75 0 113.5 0 1.75 1.75 0 01-3.5 0z"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7.15 1.5h1.7a1 1 0 01.986.836l.164.982a5.535 5.535 0 011.085.626l.937-.36a1 1 0 011.23.468l.85 1.472a1 1 0 01-.244 1.286l-.774.634c.05.358.076.724.076 1.096s-.026.738-.076 1.096l.774.634a1 1 0 01.244 1.286l-.85 1.472a1 1 0 01-1.23.468l-.937-.36a5.535 5.535 0 01-1.085.626l-.164.982A1 1 0 018.85 14.5h-1.7a1 1 0 01-.986-.836l-.164-.982a5.535 5.535 0 01-1.085-.626l-.937.36a1 1 0 01-1.23-.468l-.85-1.472a1 1 0 01.244-1.286l.774-.634A6.745 6.745 0 012.75 8c0-.372.026-.738.076-1.096l-.774-.634a1 1 0 01-.244-1.286l.85-1.472a1 1 0 011.23-.468l.937.36a5.535 5.535 0 011.085-.626l.164-.982A1 1 0 017.15 1.5z"
              />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
};


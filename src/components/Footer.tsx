import React from 'react';
import { Link } from 'react-router-dom';

const FOOTER_LINKS = [
  { to: '/', label: 'Beranda' },
  { to: '/#tentang', label: 'Tentang' },
  { to: '/#cara-kerja', label: 'Cara Kerja' },
  { to: '/#fitur', label: 'Fitur' },
];

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-background border-t border-divider/40 py-8 sm:py-6">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-10 flex flex-col md:flex-row items-center justify-between gap-5 md:gap-4 text-center md:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
          <span className="font-semibold text-[13px] text-text">SebelumTeken</span>
          <nav aria-label="Navigasi footer" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {FOOTER_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-[12px] text-secondary hover:text-text transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-6">
          <p className="font-semibold text-[12px] leading-4 tracking-[0.48px] text-secondary">
            Dibantu AI. Bukan nasihat hukum.
          </p>
          <p className="font-semibold text-[12px] leading-4 tracking-[0.48px] text-secondary">
            © SebelumTeken 2026
          </p>
        </div>
      </div>
    </footer>
  );
};

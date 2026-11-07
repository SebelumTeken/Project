import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-background border-t border-divider/40 py-6">
      <div className="max-w-[1120px] mx-auto px-4 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <p className="font-semibold text-[12px] leading-4 tracking-[0.48px] text-secondary">
          Dibantu AI. Bukan nasihat hukum.
        </p>
        <p className="font-semibold text-[12px] leading-4 tracking-[0.48px] text-secondary">
          SebelumTeken © 2026
        </p>
      </div>
    </footer>
  );
};


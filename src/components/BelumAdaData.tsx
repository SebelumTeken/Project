import React from 'react';
import { Button } from './Button';
import { TextLink } from './TextLink';

interface Tautan {
  label: string;
  to: string;
}

interface BelumAdaDataProps {
  judul: string;
  pesan: string;
  tombol: Tautan;
  tautanLain?: Tautan;
}

/**
 * Ditampilkan di Mode AI saat data tahap sebelumnya belum ada,
 * supaya halaman tidak diam-diam menampilkan data contoh.
 */
export const BelumAdaData: React.FC<BelumAdaDataProps> = ({
  judul,
  pesan,
  tombol,
  tautanLain,
}) => (
  <div className="w-full flex-1 flex flex-col items-center justify-center px-4 sm:px-10 py-16 sm:py-24">
    <div className="w-full max-w-[620px] flex flex-col items-center text-center">
      <h1 className="font-semibold text-4xl sm:text-[48px] leading-tight sm:leading-[52px] tracking-[-1.2px] text-text">
        {judul}
      </h1>
      <p className="mt-4 font-normal text-[17px] leading-[25px] text-secondary">{pesan}</p>
      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
        <Button to={tombol.to}>{tombol.label}</Button>
        {tautanLain && <TextLink to={tautanLain.to}>{tautanLain.label}</TextLink>}
      </div>
    </div>
  </div>
);

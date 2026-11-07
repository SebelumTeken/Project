import React, { useEffect, useId, useRef, useState } from 'react';
import { DAFTAR_SEKTOR } from '../lib/upahSektor';

interface Pilihan {
  kode: string;
  label: string;
  contoh?: string;
}

const PILIHAN: Pilihan[] = [
  { kode: 'tidak_tahu', label: 'Tidak tahu', contoh: 'Boleh dipilih jika belum yakin' },
  ...DAFTAR_SEKTOR.map(({ kode, label, contoh }) => ({ kode, label, contoh })),
];

interface Props {
  id: string;
  /** id elemen label pertanyaan, dipakai sebagai nama aksesibel tombol dan daftar */
  labelId: string;
  value: string;
  onChange: (kode: string) => void;
}

/**
 * Dropdown bidang usaha. Pengganti <select> bawaan supaya tiap pilihan bisa
 * menampilkan nama bidang dan contohnya dalam dua baris.
 * Pola ARIA: tombol (aria-haspopup="listbox") + listbox dengan aria-activedescendant.
 */
export const PilihSektor: React.FC<Props> = ({ id, labelId, value, onChange }) => {
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const indexTerpilih = Math.max(0, PILIHAN.findIndex((p) => p.kode === value));
  const [buka, setBuka] = useState(false);
  const [aktif, setAktif] = useState(indexTerpilih);

  const terpilih = PILIHAN[indexTerpilih];

  // Tutup saat klik di luar komponen
  useEffect(() => {
    if (!buka) return;
    const tutup = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setBuka(false);
    };
    document.addEventListener('mousedown', tutup);
    return () => document.removeEventListener('mousedown', tutup);
  }, [buka]);

  // Saat dibuka: fokus ke daftar dan pastikan pilihan aktif terlihat
  useEffect(() => {
    if (!buka) return;
    listRef.current?.focus();
  }, [buka]);

  useEffect(() => {
    if (!buka) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${aktif}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [buka, aktif]);

  const bukaDaftar = () => {
    setAktif(indexTerpilih);
    setBuka(true);
  };

  const pilih = (i: number) => {
    onChange(PILIHAN[i].kode);
    setBuka(false);
    buttonRef.current?.focus();
  };

  const onKeyTombol = (e: React.KeyboardEvent) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      bukaDaftar();
    }
  };

  const onKeyDaftar = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setAktif((i) => Math.min(PILIHAN.length - 1, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setAktif((i) => Math.max(0, i - 1));
        break;
      case 'Home':
        e.preventDefault();
        setAktif(0);
        break;
      case 'End':
        e.preventDefault();
        setAktif(PILIHAN.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        pilih(aktif);
        break;
      case 'Escape':
        e.preventDefault();
        setBuka(false);
        buttonRef.current?.focus();
        break;
      case 'Tab':
        setBuka(false);
        break;
      default:
        // Ketik huruf awal untuk lompat ke bidang
        if (e.key.length === 1 && /\S/.test(e.key)) {
          const huruf = e.key.toLowerCase();
          const n = PILIHAN.length;
          for (let k = 1; k <= n; k++) {
            const j = (aktif + k) % n;
            if (PILIHAN[j].label.toLowerCase().startsWith(huruf)) {
              setAktif(j);
              break;
            }
          }
        }
    }
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      <button
        ref={buttonRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-labelledby={`${labelId} ${id}`}
        aria-expanded={buka}
        aria-controls={listId}
        onClick={() => (buka ? setBuka(false) : bukaDaftar())}
        onKeyDown={onKeyTombol}
        className={`w-full h-12 pl-5 pr-12 bg-surface rounded-full text-left text-[16px] text-text transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          buka ? 'ring-2 ring-accent/30' : ''
        }`}
      >
        <span className={`block truncate ${terpilih.kode === 'tidak_tahu' ? 'text-secondary' : ''}`}>
          {terpilih.label}
        </span>
        <svg
          className={`pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary transition-transform duration-200 ${
            buka ? 'rotate-180' : ''
          }`}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {buka && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={labelId}
          aria-activedescendant={`${listId}-${aktif}`}
          onKeyDown={onKeyDaftar}
          className="absolute z-30 left-0 right-0 mt-2 max-h-[340px] overflow-y-auto p-1.5 bg-background rounded-3xl border border-divider/50 shadow-[0_12px_40px_-12px_rgba(26,28,29,0.25)] focus:outline-none"
        >
          {PILIHAN.map((p, i) => {
            const dipilih = i === indexTerpilih;
            return (
              <li
                key={p.kode}
                id={`${listId}-${i}`}
                data-index={i}
                role="option"
                aria-selected={dipilih}
                onMouseEnter={() => setAktif(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pilih(i)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl cursor-pointer select-none ${
                  i === aktif ? 'bg-surface' : ''
                } ${i === 0 ? 'mb-1' : ''}`}
              >
                <span className="flex-1 min-w-0">
                  <span className={`block text-[15px] leading-5 ${dipilih ? 'font-semibold text-text' : 'font-medium text-text'}`}>
                    {p.label}
                  </span>
                  {p.contoh && (
                    <span className="block text-[13px] leading-5 text-secondary truncate">{p.contoh}</span>
                  )}
                </span>
                <svg
                  className={`w-4 h-4 shrink-0 text-accent ${dipilih ? 'opacity-100' : 'opacity-0'}`}
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3.5 8.5l3 3 6-7" />
                </svg>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

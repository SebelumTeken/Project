import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { Button } from '../components/Button';
import { TextLink } from '../components/TextLink';
import { useSession } from '../store/session';
import { kecilkanGambar } from '../lib/gambar';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const CekLowongan: React.FC = () => {
  const navigate = useNavigate();
  const { mode, setLowongan, loadDemoData } = useSession();

  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    file: File | null;
    previewUrl: string;
    sizeFormatted: string;
  } | null>(null);
  const [errorTooLarge, setErrorTooLarge] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorTooLarge(true);
      setSelectedFile(null);
      return;
    }

    setErrorTooLarge(false);
    const previewUrl = URL.createObjectURL(file);
    setSelectedFile({
      name: file.name,
      file,
      previewUrl,
      sizeFormatted: formatFileSize(file.size),
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handlePakaiContoh = () => {
    loadDemoData();
    setErrorTooLarge(false);
    setSelectedFile({
      name: 'lowongan_admin.png',
      file: null,
      previewUrl:
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="%23D2D2D7"/><text x="40" y="44" font-family="sans-serif" font-size="10" fill="%235F5E60" text-anchor="middle">Contoh</text></svg>',
      sizeFormatted: '142 KB',
    });
  };

  const handlePeriksa = async () => {
    if (!selectedFile || errorTooLarge) return;

    if (mode === 'ai' && selectedFile.file) {
      const gambarData = await kecilkanGambar(selectedFile.file);
      setLowongan({
        teks_terbaca: '',
        nama_perusahaan: null,
        posisi: null,
        lokasi: null,
        gaji_tertulis: null,
        kontak: null,
        tingkat_perhatian: 'rendah',
        ringkasan: '',
        temuan: [],
        gambar_data: gambarData,
      });
    } else if (selectedFile.name !== 'lowongan_admin.png') {
      setLowongan({
        teks_terbaca: 'Contoh teks poster lowongan kerja.',
        nama_perusahaan: null,
        posisi: 'Staff Administrasi',
        lokasi: 'Padang',
        gaji_tertulis: 3000000,
        kontak: 'email@resmi.com',
        tingkat_perhatian: 'rendah',
        ringkasan: 'Lowongan kerja umum.',
        temuan: [],
        gambar_data: selectedFile.previewUrl,
      });
    }
    navigate('/lowongan/memeriksa');
  };

  return (
    <AppLayout>
      {/* Sub-Header Step Bar (matching Section padding: 8px 120px) */}
      <div className="w-full bg-background border-b border-divider/20">
        <div className="max-w-[1040px] mx-auto px-4 sm:px-10 h-11 flex items-center justify-between text-sm">
          <span className="font-normal text-[14px] leading-5 tracking-[-0.35px] text-text select-none">
            Cek Lowongan
          </span>
          <span className="font-semibold text-[12px] leading-4 tracking-[1.2px] uppercase text-secondary select-none">
            1 DARI 3
          </span>
          <TextLink to="/" className="text-sm font-normal text-nav">
            Beranda
          </TextLink>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full flex-1 flex flex-col items-center px-4 sm:px-10 pt-10 pb-24">
        <div className="w-full max-w-[1040px] flex flex-col items-center">
          {/* Headline (72px desktop / responsive) */}
          <section className="w-full text-center mb-8 sm:mb-16">
            <h1 className="font-semibold text-4xl sm:text-6xl md:text-[72px] leading-tight md:leading-[76px] tracking-[-1.8px] text-text">
              Unggah lowongannya.
            </h1>
          </section>

          {/* Form / Upload Column (max-w 760px) */}
          <div className="w-full max-w-[760px] flex flex-col items-center">
            {/* Upload Panel */}
            <div
              className={`w-full h-[280px] sm:h-[380px] bg-surface rounded-[24px] sm:rounded-[32px] flex flex-col items-center justify-center p-6 sm:p-8 sm:px-12 text-center transition-all border-2 border-dashed ${
                isDragging
                  ? 'border-accent bg-surface/70 scale-[0.99]'
                  : 'border-transparent'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={handleInputChange}
              />

              {/* Upload SVG Icon matching Figma vector specs */}
              <div className="w-12 h-12 mb-6 flex items-center justify-center">
                <svg
                  className="w-9 h-9 text-secondary"
                  viewBox="0 0 36 36"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {/* Arrow vector */}
                  <line x1="18" y1="6" x2="18" y2="23" />
                  <polyline points="10.5 13.5 18 6 25.5 13.5" />
                  {/* Tray vector */}
                  <path d="M 6 25 L 6 30 L 30 30 L 30 25" />
                </svg>
              </div>

              {/* Text */}
              <p className="font-medium text-[19px] leading-7 tracking-[-0.095px] text-text mb-2 text-center">
                Seret poster ke sini
              </p>

              {/* Button → Pilih file › */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 font-normal text-[17px] leading-[25px] tracking-[-0.051px] text-accent hover:text-accent-strong transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
              >
                <span>Pilih file</span>
                <span className="select-none" aria-hidden="true">
                  ›
                </span>
              </button>
            </div>

            {/* State: File too large (> 5 MB) */}
            {errorTooLarge && (
              <div className="w-full mt-4 p-3 bg-danger/10 text-danger text-sm rounded-2xl text-center">
                Ukuran gambar melebihi 5 MB. Coba gambar yang lebih kecil (JPG/PNG).
              </div>
            )}

            {/* Row below panel (File preview row & Pakai contoh link) */}
            <div className="w-full min-h-[52px] pt-6 px-1 flex flex-row flex-wrap items-center justify-between gap-x-4 gap-y-3">
              {/* Selected File Row */}
              {selectedFile && !errorTooLarge ? (
                <div className="flex items-center gap-3 min-w-0">
                  {/* Thumbnail */}
                  <div className="w-7 h-7 bg-[#EEEEF0] rounded-2xl overflow-hidden flex items-center justify-center shrink-0">
                    {selectedFile.previewUrl.startsWith('data:image/svg') ? (
                      <svg
                        className="w-3.5 h-3.5 text-secondary"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M4 3a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2H4zm8 2v4.586l-2.293-2.293a1 1 0 00-1.414 0L6 9.586 4.707 8.293a1 1 0 00-1.414 0L2 9.586V5a1 1 0 011-1h8a1 1 0 011 1z" />
                      </svg>
                    ) : (
                      <img
                        src={selectedFile.previewUrl}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="font-medium text-[14px] leading-5 tracking-[-0.35px] text-text truncate max-w-[120px] sm:max-w-[240px]">
                      {selectedFile.name}
                    </span>
                    <span className="font-semibold text-[12px] leading-4 text-secondary">
                      {selectedFile.sizeFormatted}
                    </span>
                    {/* Check icon in #004E9F */}
                    <div
                      className="w-3 h-3 rounded-full bg-accent-strong flex items-center justify-center shrink-0"
                      aria-label="File valid"
                    >
                      <svg
                        className="w-2 h-2 text-background"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="2.5 6 5 8.5 9.5 3.5" />
                      </svg>
                    </div>
                  </div>

                  {/* Clear button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="ml-1 text-xs text-secondary hover:text-danger focus:outline-none focus-visible:ring-1 focus-visible:ring-accent rounded"
                    title="Hapus file"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div />
              )}

              {/* Link: Pakai contoh › */}
              <button
                type="button"
                onClick={handlePakaiContoh}
                className="font-normal text-[14px] leading-5 text-accent hover:text-accent-strong transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm shrink-0"
              >
                Pakai contoh ›
              </button>
            </div>

            {/* Bottom Action Area (Button Periksa + Note) */}
            <div className="w-full pt-10 sm:pt-16 flex flex-col items-center gap-4">
              <Button
                onClick={handlePeriksa}
                disabled={!selectedFile || errorTooLarge}
                className="w-full sm:!w-[200px] sm:!min-w-[200px] !px-0"
              >
                Periksa
              </Button>

              <p className="font-normal text-[14px] leading-5 text-secondary text-center">
                Gambar tidak disimpan di server kami.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

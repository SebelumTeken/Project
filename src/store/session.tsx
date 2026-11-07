import React, { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { AppMode, LowonganData, TawaranData, PesanLatihan, EvaluasiLatihan } from '../types';
import demoKasusData from '../data/demo-kasus.json';

export type BagianContoh = 'lowongan' | 'tawaran' | 'evaluasi';

const SEMUA_BAGIAN: BagianContoh[] = ['lowongan', 'tawaran', 'evaluasi'];

/** Poster yang sudah diunggah dan menunggu dianalisis AI. */
export interface PosterMenunggu {
  gambarData: string;
  namaFile: string;
}

const demo = demoKasusData as unknown as {
  lowongan: LowonganData;
  tawaran: TawaranData;
  latihan: {
    evaluasi: EvaluasiLatihan;
  };
};

interface SessionContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  lowongan: LowonganData | null;
  setLowongan: (data: LowonganData | null) => void;
  posterMenunggu: PosterMenunggu | null;
  setPosterMenunggu: (data: PosterMenunggu | null) => void;
  tawaran: TawaranData | null;
  setTawaran: (data: TawaranData | null) => void;
  pesanLatihan: PesanLatihan[];
  setPesanLatihan: React.Dispatch<React.SetStateAction<PesanLatihan[]>>;
  evaluasi: EvaluasiLatihan | null;
  setEvaluasi: (data: EvaluasiLatihan | null) => void;
  /** Mengganti bagian yang dipilih (default: semua) dengan data contoh. */
  loadDemoData: (bagian?: BagianContoh[]) => void;
  /** Mengisi bagian yang masih kosong dengan data contoh tanpa menimpa data yang ada. Khusus Mode Contoh. */
  lengkapiDataContoh: () => void;
  /** Mengosongkan percakapan dan evaluasi latihan. */
  resetLatihan: () => void;
  resetSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Stored in memory only (never persisted to localStorage or environment)
  const [mode, setMode] = useState<AppMode>('contoh');
  const [apiKey, setApiKey] = useState<string>('');
  const [lowongan, setLowongan] = useState<LowonganData | null>(null);
  const [posterMenunggu, setPosterMenunggu] = useState<PosterMenunggu | null>(null);
  const [tawaran, setTawaran] = useState<TawaranData | null>(null);
  const [pesanLatihan, setPesanLatihan] = useState<PesanLatihan[]>([]);
  const [evaluasi, setEvaluasi] = useState<EvaluasiLatihan | null>(null);

  const loadDemoData = useCallback((bagian: BagianContoh[] = SEMUA_BAGIAN) => {
    if (bagian.includes('lowongan')) {
      setLowongan(demo.lowongan);
      setPosterMenunggu(null);
    }
    if (bagian.includes('tawaran')) {
      setTawaran(demo.tawaran);
      // Konteks tawaran berubah, jadi percakapan lama tidak relevan lagi.
      setPesanLatihan([]);
    }
    if (bagian.includes('evaluasi')) {
      setEvaluasi(demo.latihan.evaluasi);
    }
  }, []);

  const lengkapiDataContoh = useCallback(() => {
    setLowongan((prev) => prev ?? demo.lowongan);
    setTawaran((prev) => prev ?? demo.tawaran);
    setEvaluasi((prev) => prev ?? demo.latihan.evaluasi);
  }, []);

  const resetLatihan = useCallback(() => {
    setPesanLatihan([]);
    setEvaluasi(null);
  }, []);

  const resetSession = useCallback(() => {
    setLowongan(null);
    setPosterMenunggu(null);
    setTawaran(null);
    setPesanLatihan([]);
    setEvaluasi(null);
  }, []);

  return (
    <SessionContext.Provider
      value={{
        mode,
        setMode,
        apiKey,
        setApiKey,
        lowongan,
        setLowongan,
        posterMenunggu,
        setPosterMenunggu,
        tawaran,
        setTawaran,
        pesanLatihan,
        setPesanLatihan,
        evaluasi,
        setEvaluasi,
        loadDemoData,
        lengkapiDataContoh,
        resetLatihan,
        resetSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

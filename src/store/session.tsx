import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppMode, LowonganData, TawaranData, PesanLatihan, EvaluasiLatihan } from '../types';
import demoKasusData from '../data/demo-kasus.json';

interface SessionContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  lowongan: LowonganData | null;
  setLowongan: (data: LowonganData | null) => void;
  tawaran: TawaranData | null;
  setTawaran: (data: TawaranData | null) => void;
  pesanLatihan: PesanLatihan[];
  setPesanLatihan: React.Dispatch<React.SetStateAction<PesanLatihan[]>>;
  evaluasi: EvaluasiLatihan | null;
  setEvaluasi: (data: EvaluasiLatihan | null) => void;
  loadDemoData: () => void;
  resetSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Stored in memory only (never persisted to localStorage or environment)
  const [mode, setMode] = useState<AppMode>('contoh');
  const [apiKey, setApiKey] = useState<string>('');
  const [lowongan, setLowongan] = useState<LowonganData | null>(null);
  const [tawaran, setTawaran] = useState<TawaranData | null>(null);
  const [pesanLatihan, setPesanLatihan] = useState<PesanLatihan[]>([]);
  const [evaluasi, setEvaluasi] = useState<EvaluasiLatihan | null>(null);

  const loadDemoData = () => {
    const demo = demoKasusData as unknown as {
      lowongan: LowonganData;
      tawaran: TawaranData;
      latihan: {
        percakapan_awal: PesanLatihan[];
        evaluasi: EvaluasiLatihan;
      };
    };
    setLowongan(demo.lowongan);
    setTawaran(demo.tawaran);
    setPesanLatihan(demo.latihan.percakapan_awal);
    setEvaluasi(demo.latihan.evaluasi);
  };

  const resetSession = () => {
    setLowongan(null);
    setTawaran(null);
    setPesanLatihan([]);
    setEvaluasi(null);
  };

  return (
    <SessionContext.Provider
      value={{
        mode,
        setMode,
        apiKey,
        setApiKey,
        lowongan,
        setLowongan,
        tawaran,
        setTawaran,
        pesanLatihan,
        setPesanLatihan,
        evaluasi,
        setEvaluasi,
        loadDemoData,
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


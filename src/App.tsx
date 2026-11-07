import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SessionProvider } from './store/session';
import { Beranda } from './pages/Beranda';
import { CekLowongan } from './pages/CekLowongan';
import { Memeriksa } from './pages/Memeriksa';
import { HasilLowongan } from './pages/HasilLowongan';
import { CekTawaran } from './pages/CekTawaran';
import { HasilTawaran } from './pages/HasilTawaran';
import { Latihan } from './pages/Latihan';
import { HasilLatihan } from './pages/HasilLatihan';
import { Pengaturan } from './pages/Pengaturan';
import { Ringkasan } from './pages/Ringkasan';

export const App: React.FC = () => {
  return (
    <SessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Beranda />} />
          <Route path="/lowongan" element={<CekLowongan />} />
          <Route path="/lowongan/memeriksa" element={<Memeriksa />} />
          <Route path="/lowongan/hasil" element={<HasilLowongan />} />
          <Route path="/tawaran" element={<CekTawaran />} />
          <Route path="/tawaran/hasil" element={<HasilTawaran />} />
          <Route path="/latihan" element={<Latihan />} />
          <Route path="/latihan/hasil" element={<HasilLatihan />} />
          <Route path="/pengaturan" element={<Pengaturan />} />
          <Route path="/ringkasan" element={<Ringkasan />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SessionProvider>
  );
};

export default App;


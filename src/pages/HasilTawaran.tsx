import React from 'react';
import { AppLayout } from '../components/AppLayout';

export const HasilTawaran: React.FC = () => {
  return (
    <AppLayout stepText="2 dari 3" isDemo>
      <div className="max-w-[760px] mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-semibold text-text mb-4">Hasil Tawaran</h1>
      </div>
    </AppLayout>
  );
};


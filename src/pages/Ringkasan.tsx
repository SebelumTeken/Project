import React from 'react';
import { AppLayout } from '../components/AppLayout';
import { useSession } from '../store/session';
import { Button } from '../components/Button';
import { TextLink } from '../components/TextLink';
import { useNavigate } from 'react-router-dom';

export const Ringkasan: React.FC = () => {
  const { resetSession } = useSession();
  const navigate = useNavigate();

  const handleMulaiBaru = () => {
    resetSession();
    navigate('/');
  };

  return (
    <AppLayout isDemo>
      <div className="max-w-[1040px] mx-auto w-full px-4 py-16 text-center">
        <h1 className="text-4xl font-semibold text-text mb-8">Ringkasanmu.</h1>
        <div className="flex items-center justify-center gap-6 mt-10">
          <TextLink onClick={handleMulaiBaru}>Mulai baru</TextLink>
          <Button onClick={() => window.print()}>Cetak</Button>
        </div>
      </div>
    </AppLayout>
  );
};


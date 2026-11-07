import React from 'react';
import { AppLayout } from '../components/AppLayout';
import { useSession } from '../store/session';
import { Button } from '../components/Button';
import { TextLink } from '../components/TextLink';

export const Pengaturan: React.FC = () => {
  const { mode, setMode, apiKey, setApiKey } = useSession();

  return (
    <AppLayout>
      <div className="max-w-[560px] mx-auto w-full px-4 py-16">
        <div className="mb-6">
          <TextLink to="/">‹ Kembali</TextLink>
        </div>
        <h1 className="text-3xl font-semibold text-text mb-8 text-center">Pengaturan</h1>

        <div className="space-y-6">
          {/* Mode Toggle */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">Mode</label>
            <div className="grid grid-cols-2 p-1 bg-surface rounded-xl">
              <button
                type="button"
                onClick={() => setMode('contoh')}
                className={`py-2 text-sm font-medium rounded-lg transition-colors ${
                  mode === 'contoh'
                    ? 'bg-background text-text shadow-sm'
                    : 'text-secondary hover:text-text'
                }`}
              >
                Contoh
              </button>
              <button
                type="button"
                onClick={() => setMode('ai')}
                className={`py-2 text-sm font-medium rounded-lg transition-colors ${
                  mode === 'ai'
                    ? 'bg-background text-text shadow-sm'
                    : 'text-secondary hover:text-text'
                }`}
              >
                AI
              </button>
            </div>
          </div>

          {/* API Key Input */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Masukkan API key..."
              className="w-full h-12 px-4 bg-surface rounded-xl text-text placeholder-secondary/60 focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <p className="mt-2 text-xs text-secondary">
              Disimpan sementara di memori, tidak di localStorage.
            </p>
          </div>

          <div className="pt-4 flex justify-center">
            <Button to="/">Simpan</Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};


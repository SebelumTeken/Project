import React from 'react';
import { AppLayout } from '../components/AppLayout';
import { Button } from '../components/Button';
import { TextLink } from '../components/TextLink';
import { Panel } from '../components/Panel';

export const Beranda: React.FC = () => {
  const scrollToSteps = () => {
    const el = document.getElementById('langkah-pemeriksaan');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <AppLayout>
      <div className="w-full flex-1 flex flex-col items-center justify-between px-4 sm:px-6 md:px-10 lg:px-20 py-10">
        <div className="w-full max-w-[1040px] flex flex-col items-center">
          {/* Hero Section */}
          <section className="w-full flex flex-col items-center text-center pt-16 pb-12 sm:pt-24 sm:pb-20 md:pt-28 md:pb-24">
            <h1 className="max-w-[820px] font-semibold text-4xl sm:text-6xl md:text-[72px] leading-tight md:leading-[76px] tracking-[-1.8px] text-text">
              Periksa dulu. Baru teken.
            </h1>

            <p className="mt-6 max-w-[620px] font-normal text-[17px] sm:text-[19px] leading-7 tracking-[-0.095px] text-secondary">
              Cek lowongan, bandingkan gaji, dan latih negosiasimu.
            </p>

            {/* Action Row */}
            <div className="mt-10 flex flex-row items-center justify-center gap-6">
              <Button to="/lowongan">Mulai</Button>
              <TextLink onClick={scrollToSteps}>Pelajari cara kerja</TextLink>
            </div>
          </section>

          {/* Three Steps Panel */}
          <section
            id="langkah-pemeriksaan"
            className="w-full max-w-[1040px] mb-10 scroll-mt-20"
          >
            <Panel
              radius="32"
              className="py-12 px-6 sm:py-16 sm:px-12 md:py-20 md:px-16"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
                {/* Step 01 */}
                <div className="flex flex-col items-start text-left">
                  <span className="font-semibold text-[48px] leading-[52px] tracking-[-1.2px] text-text">
                    01
                  </span>
                  <h2 className="mt-2 font-semibold text-[28px] leading-[34px] tracking-[-0.42px] text-text">
                    Cek lowongan
                  </h2>
                  <p className="mt-2 font-normal text-[17px] leading-7 tracking-[-0.051px] text-secondary">
                    Unggah poster lowongan untuk mengenali tanda bahaya.
                  </p>
                </div>

                {/* Step 02 */}
                <div className="flex flex-col items-start text-left">
                  <span className="font-semibold text-[48px] leading-[52px] tracking-[-1.2px] text-text">
                    02
                  </span>
                  <h2 className="mt-2 font-semibold text-[28px] leading-[34px] tracking-[-0.42px] text-text">
                    Cek tawaran
                  </h2>
                  <p className="mt-2 font-normal text-[17px] leading-7 tracking-[-0.051px] text-secondary">
                    Bandingkan tawaran gaji dengan standar upah minimum.
                  </p>
                </div>

                {/* Step 03 */}
                <div className="flex flex-col items-start text-left">
                  <span className="font-semibold text-[48px] leading-[52px] tracking-[-1.2px] text-text">
                    03
                  </span>
                  <h2 className="mt-2 font-semibold text-[28px] leading-[34px] tracking-[-0.42px] text-text">
                    Latihan
                  </h2>
                  <p className="mt-2 font-normal text-[17px] leading-7 tracking-[-0.051px] text-secondary">
                    Latih percakapan negosiasi dengan HRD sebelum teken.
                  </p>
                </div>
              </div>
            </Panel>
          </section>
        </div>
      </div>
    </AppLayout>
  );
};


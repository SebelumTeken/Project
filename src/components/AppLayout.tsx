import React, { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface AppLayoutProps {
  children: ReactNode;
  stepText?: string;
  isDemo?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  stepText,
  isDemo,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text">
      <Header stepText={stepText} isDemo={isDemo} />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
    </div>
  );
};


import type { ReactNode } from 'react';
import { Header } from './header';

export function Shell({ children, step }: { children: ReactNode; step?: number }) {
  return (
    <div className="app-shell flex flex-col min-h-[100dvh]">
      <Header step={step} />
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}

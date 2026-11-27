import type { ReactNode } from 'react';
import { PixelCrestIcon } from '@/components/ui/pixel-icons';

interface AuthLayoutProps {
  children: ReactNode;
}

function PixelWindowControls() {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      <span className="relative block size-3.5 border-2 border-[#f8fafc]/80">
        <span className="absolute inset-x-0.5 bottom-0.5 h-0.5 bg-[#f8fafc]/80" />
      </span>
      <span className="relative block size-3.5 border-2 border-[#f8fafc]/80">
        <span className="absolute inset-x-0.5 top-0.5 h-1.5 border-b-2 border-[#f8fafc]/80 bg-[#f8fafc]/20" />
      </span>
      <span className="relative block size-3.5 border-2 border-[#f8fafc]/80">
        <span className="absolute top-1/2 left-1/2 h-0.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#f8fafc]/80" />
        <span className="absolute top-1/2 left-1/2 h-0.5 w-2.5 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-[#f8fafc]/80" />
      </span>
    </div>
  );
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="pixel-dither-bg flex min-h-dvh items-center justify-center p-4 sm:p-6">
      <div className="pixel-panel bg-card w-full max-w-[460px]">
        <div className="flex items-center justify-between border-b-2 border-[var(--pixel-frame)] bg-[#1f293b] px-3 py-2 text-[#f8fafc] dark:bg-[#192030]">
          <div className="flex items-center gap-2">
            <PixelCrestIcon className="size-4" />
            <span className="font-pixel-mono text-xs tracking-wider">BYAKUYA</span>
          </div>
          <PixelWindowControls />
        </div>

        <div className="relative p-6 sm:p-8">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-2 left-2 size-3 border-t-2 border-l-2 border-[var(--pixel-frame)] opacity-40"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-2 right-2 size-3 border-t-2 border-r-2 border-[var(--pixel-frame)] opacity-40"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-2 left-2 size-3 border-b-2 border-l-2 border-[var(--pixel-frame)] opacity-40"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-2 bottom-2 size-3 border-r-2 border-b-2 border-[var(--pixel-frame)] opacity-40"
          />
          {children}
        </div>
      </div>
    </div>
  );
}

import type { ReactNode } from 'react';
import { PixelCrestIcon } from '@/components/ui/pixel-icons';

interface AuthLayoutProps {
  children: ReactNode;
}

function PixelWindowButton({ children }: { children: ReactNode }) {
  return (
    <span className="relative flex size-5 items-center justify-center border-2 border-[#0b0e14] bg-[#33445e] shadow-[inset_1px_1px_0_#6b83a3,inset_-1px_-1px_0_#111a27]">
      {children}
    </span>
  );
}

function PixelWindowControls() {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      <PixelWindowButton>
        <span className="block h-[3px] w-2 bg-[#f8fafc]" />
      </PixelWindowButton>
      <PixelWindowButton>
        <span className="block size-2 border-2 border-[#f8fafc]" />
      </PixelWindowButton>
      <PixelWindowButton>
        <span className="relative block size-2">
          <span className="absolute top-1/2 left-1/2 h-[2px] w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#f8fafc]" />
          <span className="absolute top-1/2 left-1/2 h-[2px] w-2.5 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-[#f8fafc]" />
        </span>
      </PixelWindowButton>
    </div>
  );
}

type Corner = 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left';

const cornerPlacement: Record<Corner, string> = {
  'top-left': 'top-2 left-2',
  'top-right': 'top-2 right-2 rotate-90',
  'bottom-right': 'right-2 bottom-2 rotate-180',
  'bottom-left': 'bottom-2 left-2 -rotate-90',
};

function PixelCornerBracket({ corner }: { corner: Corner }) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="20"
      height="20"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      className={`pointer-events-none absolute ${cornerPlacement[corner]}`}
    >
      <path d="M2 2h11v2H4v9H2z" fill="#0b0e14" />
      <path d="M15 2h3v2h-3z" fill="#0b0e14" />
      <path d="M2 15h2v3H2z" fill="#0b0e14" />
      <path d="M3 3h10v1H4v10H3z" fill="#f8fafc" />
      <path d="M15 3h2v1h-2z" fill="#93a7c4" />
      <path d="M3 15h1v2H3z" fill="#93a7c4" />
      <rect x="5" y="5" width="2" height="2" fill="#1b5e8a" />
      <rect x="8" y="8" width="1" height="2" fill="#93a7c4" />
    </svg>
  );
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="pixel-auth-bg flex min-h-dvh items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[460px] border-2 border-[#0b0e14] bg-[#dde4ef] text-[#0f172a] shadow-[inset_2px_2px_0_#ffffff,4px_4px_0_#07090e]">
        <div className="flex items-center justify-between border-b-2 border-[#0b0e14] bg-[#1c2738] px-3 py-2 text-[#f8fafc]">
          <div className="flex items-center gap-2">
            <PixelCrestIcon className="size-4" />
            <span className="font-pixel-mono text-xs tracking-wider">BYAKUYA</span>
          </div>
          <PixelWindowControls />
        </div>

        <div className="relative p-6 sm:p-8">
          <PixelCornerBracket corner="top-left" />
          <PixelCornerBracket corner="top-right" />
          <PixelCornerBracket corner="bottom-right" />
          <PixelCornerBracket corner="bottom-left" />
          {children}
        </div>
      </div>
    </div>
  );
}

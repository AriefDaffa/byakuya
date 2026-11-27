import type { ReactNode } from 'react';
import { PixelCrestIcon } from '@/components/ui/pixel-icons';

interface AuthLayoutProps {
  children: ReactNode;
}

function PixelWindowButton({ children }: { children: ReactNode }) {
  return (
    <span className="relative flex size-6 items-center justify-center border-2 border-[#0b0e14] bg-[#33445e] shadow-[inset_2px_2px_0_#6b83a3,inset_-2px_-2px_0_#111a27]">
      {children}
    </span>
  );
}

function PixelWindowControls() {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      <PixelWindowButton>
        <span className="block h-[3px] w-2.5 bg-[#f8fafc]" />
      </PixelWindowButton>
      <PixelWindowButton>
        <span className="block size-2.5 border-2 border-[#f8fafc]" />
      </PixelWindowButton>
      <PixelWindowButton>
        <span className="relative block size-2.5">
          <span className="absolute top-1/2 left-1/2 h-[2px] w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#f8fafc]" />
          <span className="absolute top-1/2 left-1/2 h-[2px] w-3 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-[#f8fafc]" />
        </span>
      </PixelWindowButton>
    </div>
  );
}

type Corner = 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left';

const cornerPlacement: Record<Corner, string> = {
  'top-left': 'top-1 left-1',
  'top-right': 'top-1 right-1 rotate-90',
  'bottom-right': 'right-1 bottom-1 rotate-180',
  'bottom-left': 'bottom-1 left-1 -rotate-90',
};

function PixelCornerBracket({ corner }: { corner: Corner }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      className={`pointer-events-none absolute size-6 ${cornerPlacement[corner]}`}
    >
      {/* Thick dark pixel L-frame */}
      <rect x="2" y="2" width="12" height="3" fill="#0b0e14" />
      <rect x="2" y="2" width="3" height="12" fill="#0b0e14" />
      {/* Detached pixel blocks for the stepped ornament */}
      <rect x="17" y="2" width="3" height="3" fill="#0b0e14" />
      <rect x="2" y="17" width="3" height="3" fill="#0b0e14" />
      <rect x="22" y="2" width="1" height="3" fill="#475569" />
      <rect x="2" y="22" width="3" height="1" fill="#475569" />
      {/* Inner white highlight bevel */}
      <rect x="5" y="5" width="9" height="2" fill="#f8fafc" />
      <rect x="5" y="5" width="2" height="9" fill="#f8fafc" />
      {/* Muted silver step + blue accent pixel */}
      <rect x="7" y="7" width="2" height="2" fill="#93a7c4" />
      <rect x="10" y="10" width="4" height="4" fill="#1b5e8a" />
    </svg>
  );
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="pixel-auth-bg flex min-h-dvh items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[490px] border-2 border-[#090c12] bg-[#d8e0ec] text-[#0f172a] shadow-[6px_6px_0_#07090e]">
        <div className="m-1.5 flex flex-col border-2 border-[#475569] bg-[#dde4ef]">
          <div className="flex items-center justify-between border-b-2 border-[#475569] bg-[#1d283a] px-4 py-3 text-[#f8fafc]">
            <div className="flex items-center gap-2.5">
              <PixelCrestIcon className="size-5" />
              <span className="font-pixel-mono text-base font-bold tracking-widest">
                BYAKUYA
              </span>
            </div>
            <PixelWindowControls />
          </div>

          <div className="relative p-7 sm:p-8">
            <PixelCornerBracket corner="top-left" />
            <PixelCornerBracket corner="top-right" />
            <PixelCornerBracket corner="bottom-right" />
            <PixelCornerBracket corner="bottom-left" />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

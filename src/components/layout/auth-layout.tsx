import type { ReactNode } from 'react';
import { PixelCrestIcon } from '@/components/ui/pixel-icons';

interface AuthLayoutProps {
  children: ReactNode;
}

function PixelWindowButton({ children }: { children: ReactNode }) {
  return (
    <span className="relative flex size-6 items-center justify-center border-2 border-[#0b0e14] bg-[#b8c1d1] shadow-[inset_2px_2px_0_#eef4ff,inset_-2px_-2px_0_#64748b]">
      {children}
    </span>
  );
}

function PixelWindowControls() {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      <PixelWindowButton>
        <span className="block h-[3px] w-2.5 bg-[#0e131d]" />
      </PixelWindowButton>
      <PixelWindowButton>
        <span className="block size-2.5 border-2 border-[#0e131d]" />
      </PixelWindowButton>
      <PixelWindowButton>
        <span className="relative block size-2.5">
          <span className="absolute top-1/2 left-1/2 h-[2px] w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-[#0e131d]" />
          <span className="absolute top-1/2 left-1/2 h-[2px] w-3 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-[#0e131d]" />
        </span>
      </PixelWindowButton>
    </div>
  );
}

type Corner = 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left';

const cornerPlacement: Record<Corner, string> = {
  'top-left': 'top-0 left-0',
  'top-right': 'top-0 right-0 rotate-90',
  'bottom-right': 'right-0 bottom-0 rotate-180',
  'bottom-left': 'bottom-0 left-0 -rotate-90',
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
      className={`pointer-events-none absolute size-5 ${cornerPlacement[corner]}`}
    >
      <rect x="0" y="0" width="16" height="4" fill="#1e293b" />
      <rect x="0" y="0" width="4" height="16" fill="#1e293b" />
      <rect x="2" y="2" width="10" height="2" fill="#94a3b8" />
      <rect x="2" y="2" width="2" height="10" fill="#94a3b8" />
      <rect x="6" y="6" width="6" height="6" fill="#334155" />
      <rect x="8" y="8" width="2" height="2" fill="#cbd5e1" />
    </svg>
  );
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="pixel-auth-bg flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-[520px] border-2 border-[#090c12] bg-[#d8e0ec] text-[#0f172a] shadow-[6px_6px_0_#07090e]">
        <div className="m-1.5 flex flex-col border-2 border-[#334155] bg-[#e2e8f2]">
          <div className="flex items-center justify-between border-b-2 border-[#090c12] bg-[#1d283a] px-4 py-3 text-[#f8fafc] shadow-[inset_0_2px_0_rgba(255,255,255,0.16)]">
            <div className="flex items-center gap-2.5">
              <PixelCrestIcon monochrome className="size-6 text-[#cbd5e1]" />
              <span className="font-pixel text-lg leading-none font-bold tracking-wider">
                BYAKUYA
              </span>
            </div>
            <PixelWindowControls />
          </div>

          <div className="relative p-6 sm:px-8 sm:py-6">
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

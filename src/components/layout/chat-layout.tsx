'use client';

import { PixelBackIcon, PixelCrestIcon } from '@/components/ui/pixel-icons';
import { useChatStore } from '@/store/chat-store';
import { cn } from '@/lib/utils';
import { useEffect, type ReactNode } from 'react';

interface ChatLayoutProps {
  sidebar: ReactNode;
  chatSection: ReactNode;
  /** Whether the chat panel is expanded over the sidebar on small screens. */
  isChatOpen?: boolean;
  onCloseChat?: () => void;
}

export function ChatLayout({
  sidebar,
  chatSection,
  isChatOpen = false,
  onCloseChat,
}: ChatLayoutProps) {
  const selectedUser = useChatStore((state) => state.selectedUser);

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 767px)');

    const handleBreakpointChange = (event: MediaQueryListEvent) => {
      if (!event.matches || !selectedUser) return;

      // Shrinking from a desktop window into a mobile viewport with an active
      // chat must keep that chat visible instead of dropping back to the list.
      // The back button still closes it afterwards.
      useChatStore.setState({ isChatSliderOpen: true });
    };

    mobileQuery.addEventListener('change', handleBreakpointChange);
    return () => mobileQuery.removeEventListener('change', handleBreakpointChange);
  }, [selectedUser]);

  return (
    <div className="bg-background flex h-dvh w-full flex-col overflow-hidden">
      {/* 16-bit window title bar */}
      <div className="hidden items-center justify-between border-b-2 border-[var(--pixel-frame)] bg-[#1b2131] px-3 py-1.5 text-[#f8fafc] md:flex">
        <div className="flex items-center gap-2">
          <PixelCrestIcon className="size-4 text-[#e2c275]" />
          <span className="font-pixel text-sm font-semibold">Byakuya</span>
        </div>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="size-3 border border-[#0b101b] bg-[#46516b] shadow-[inset_1px_1px_0_#6b7896]" />
          <span className="size-3 border border-[#0b101b] bg-[#46516b] shadow-[inset_1px_1px_0_#6b7896]" />
          <span className="size-3 border border-[#0b101b] bg-[#8a3d3d] shadow-[inset_1px_1px_0_#c25a5a]" />
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-h-0 w-full shrink-0 md:w-[340px] lg:w-[400px]">
          <div className="min-h-0 w-full">{sidebar}</div>
        </div>

        {/*
          A single chat section is mounted here for both breakpoints. On mobile
          it slides over the sidebar when open; on desktop it is always visible.
          Mounting one instance avoids duplicate message fetches and realtime
          channel subscriptions.
        */}
        <div
          className={cn(
            'pixel-dither-bg relative min-h-0 min-w-0 flex-1 md:flex',
            isChatOpen
              ? 'max-md:fixed max-md:inset-0 max-md:z-50 max-md:flex'
              : 'max-md:hidden',
          )}
        >
          {chatSection}
          {isChatOpen && (
            <button
              type="button"
              onClick={onCloseChat}
              className="pixel-btn bg-card text-foreground absolute top-3 left-3 z-20 inline-flex size-9 items-center justify-center md:hidden"
              aria-label="Close chat"
            >
              <PixelBackIcon className="size-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

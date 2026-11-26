import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

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
  return (
    <div className="relative flex h-screen flex-col items-center justify-center overflow-x-hidden border-t">
      <div className={cn('bg-background flex size-full rounded-md')}>
        <div className="flex size-full rounded-lg md:max-w-[350px] lg:max-w-[450px]">
          <div className="w-full">{sidebar}</div>
        </div>
        {/*
          A single chat section is mounted here for both breakpoints. On mobile
          it slides over the sidebar when open; on desktop it is always visible.
          Mounting one instance avoids duplicate message fetches and realtime
          channel subscriptions.
        */}
        <div
          className={cn(
            'relative w-full flex-1 md:flex',
            isChatOpen
              ? 'max-md:bg-background max-md:fixed max-md:inset-0 max-md:z-50 max-md:flex'
              : 'max-md:hidden',
          )}
        >
          {chatSection}
          {isChatOpen && (
            <button
              type="button"
              onClick={onCloseChat}
              className="bg-background/80 hover:bg-accent absolute top-3 right-3 z-10 inline-flex size-9 items-center justify-center rounded-full backdrop-blur transition-colors md:hidden"
              aria-label="Close chat"
            >
              <X className="size-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

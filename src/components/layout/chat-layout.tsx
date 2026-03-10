import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface ChatLayoutProps {
  sidebar: ReactNode;
  chatSection: ReactNode;
}

export function ChatLayout({ sidebar, chatSection }: ChatLayoutProps) {
  return (
    <div className="relative flex h-screen flex-col items-center justify-center overflow-x-hidden border-t">
      <div className={cn('bg-background flex size-full rounded-md')}>
        <div className="flex size-full rounded-lg md:max-w-[350px] lg:max-w-[450px]">
          <div className="w-full">{sidebar}</div>
        </div>
        <div className="relative hidden w-full flex-1 md:flex">{chatSection}</div>
      </div>
    </div>
  );
}

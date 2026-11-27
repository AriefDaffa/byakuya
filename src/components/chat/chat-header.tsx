'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PixelAddContactIcon, PixelChatThreadIcon } from '@/components/ui/pixel-icons';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  name: string;
  avatar: string;
  status?: string | null;
  className?: string;
  onProfileClick?: () => void;
}

export function ChatHeader({
  name,
  avatar,
  status,
  className,
  onProfileClick,
}: ChatHeaderProps) {
  const isOnline = status?.toLowerCase() === 'online';

  return (
    <header
      className={cn(
        'flex min-h-[68px] items-center justify-between gap-3 border-b-2 border-[#090c12] bg-[#272f59] px-4 py-3 text-[#f8fafc] shadow-[inset_0_2px_0_rgba(255,255,255,0.16),inset_0_-2px_0_rgba(0,0,0,0.3)] max-md:pl-16',
        className,
      )}
    >
      <button
        type="button"
        className="flex min-w-0 items-center gap-3 text-left"
        onClick={onProfileClick}
        aria-label={`View ${name}'s profile`}
      >
        <Avatar className="size-12 shrink-0 border-2 border-[#090c12] shadow-[2px_2px_0_#07090e]">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback>{name}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 text-left">
          <h2 className="truncate font-sans text-xl leading-tight font-bold">{name}</h2>
          {status && (
            <span className="mt-0.5 inline-flex items-center gap-1.5">
              <span
                className={cn(
                  'size-2 shrink-0',
                  isOnline ? 'bg-[var(--online)]' : 'bg-[#7b87a3]',
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  'font-sans text-sm leading-none font-semibold',
                  isOnline ? 'text-[var(--online)]' : 'text-[#9fb0d4]',
                )}
              >
                {status}
              </span>
            </span>
          )}
        </div>
      </button>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onProfileClick}
          className="pixel-btn hidden size-10 shrink-0 items-center justify-center border-[#090c12] bg-[#2f3a63] text-[#f8fafc] hover:bg-[#3b4877] sm:inline-flex"
          aria-label="Contact info"
        >
          <PixelAddContactIcon className="size-5" />
        </button>
        <button
          type="button"
          className="pixel-btn hidden size-10 shrink-0 items-center justify-center border-[#090c12] bg-[#2f3a63] text-[#f8fafc] hover:bg-[#3b4877] sm:inline-flex"
          aria-label="Chat thread"
        >
          <PixelChatThreadIcon className="size-5" />
        </button>
        <button
          type="button"
          onClick={onProfileClick}
          className="pixel-btn inline-flex size-10 shrink-0 items-center justify-center border-[#090c12] bg-[#2f3a63] text-[#f8fafc] hover:bg-[#3b4877]"
          aria-label="More options"
        >
          <span className="flex items-center gap-1" aria-hidden="true">
            <span className="size-1 bg-current" />
            <span className="size-1 bg-current" />
            <span className="size-1 bg-current" />
          </span>
        </button>
      </div>
    </header>
  );
}

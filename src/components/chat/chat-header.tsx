'use client';

import { MoreVertical } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
        'flex items-center justify-between gap-3 border-b-2 border-[#090c12] bg-[#232946] px-4 py-3 text-[#f8fafc] shadow-[inset_0_-2px_0_rgba(0,0,0,0.25)] max-md:pl-16',
        className,
      )}
    >
      <button
        type="button"
        className="flex min-w-0 items-center gap-3 text-left"
        onClick={onProfileClick}
        aria-label={`View ${name}'s profile`}
      >
        <Avatar className="size-10 shrink-0">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback>{name}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 text-left">
          <h2 className="truncate font-sans text-base leading-tight font-bold">{name}</h2>
          {status && (
            <span
              className={cn(
                'mt-1 inline-flex items-center gap-1.5 border-2 border-[#090c12] px-1.5 py-0.5',
                isOnline ? 'bg-[#1a3a2a]' : 'bg-[#2b3348]',
              )}
            >
              <span
                className={cn('size-2', isOnline ? 'bg-[var(--online)]' : 'bg-[#7b87a3]')}
                aria-hidden="true"
              />
              <span
                className={cn(
                  'font-sans text-[13px] leading-none font-semibold',
                  isOnline ? 'text-[var(--online)]' : 'text-[#aab4cc]',
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
          className="pixel-btn inline-flex size-9 shrink-0 items-center justify-center border-[#090c12] bg-[#2f3a63] text-[#c3cbe4] hover:text-[#f8fafc]"
          aria-label="More options"
        >
          <MoreVertical className="size-5" />
        </button>
      </div>
    </header>
  );
}

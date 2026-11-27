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
        'bg-card flex items-center justify-between gap-3 border-b-2 border-[var(--pixel-frame)] px-4 py-3 max-md:pl-16',
        className,
      )}
    >
      <button
        type="button"
        className="flex min-w-0 items-center gap-3 text-left"
        onClick={onProfileClick}
        aria-label={`View ${name}'s profile`}
      >
        <Avatar className="size-10">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="font-pixel text-sm font-bold">
            {name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 text-left">
          <h2 className="font-pixel truncate text-lg leading-tight font-bold">{name}</h2>
          {status && (
            <span
              className={cn(
                'pixel-box mt-1 inline-flex items-center gap-1.5 px-1.5 py-0.5',
                isOnline ? 'bg-[var(--card)]' : 'bg-muted',
              )}
            >
              <span
                className={cn(
                  'size-2 border border-[var(--pixel-frame)]',
                  isOnline ? 'bg-[var(--online)]' : 'bg-muted-foreground',
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  'font-pixel-mono text-[10px] font-bold',
                  isOnline ? 'text-[var(--online)]' : 'text-muted-foreground',
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
          className="pixel-btn bg-card text-muted-foreground hover:text-foreground inline-flex size-9 items-center justify-center"
          aria-label="More options"
        >
          <MoreVertical className="size-5" />
        </button>
      </div>
    </header>
  );
}

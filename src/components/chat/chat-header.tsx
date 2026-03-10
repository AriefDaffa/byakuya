'use client';

import { Video, Phone, MoreVertical } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ChatHeaderProps {
  name: string;
  avatar: string;
  status?: string;
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
  return (
    <header className={cn('flex items-center justify-between border-b p-4', className)}>
      <button
        type="button"
        className="flex items-center gap-3"
        onClick={onProfileClick}
        aria-label={`View ${name}'s profile`}
      >
        <Avatar className="size-10">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback>{name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="text-left">
          <h2 className="text-lg font-semibold">{name}</h2>
          {status && <p className="text-muted-foreground text-sm capitalize">{status}</p>}
        </div>
      </button>
      <div className="hidden items-center gap-2 md:flex">
        <button
          type="button"
          className="hover:bg-accent inline-flex size-9 items-center justify-center rounded-full"
          aria-label="Video call"
        >
          <Video className="text-muted-foreground size-5" />
        </button>
        <button
          type="button"
          className="hover:bg-accent inline-flex size-9 items-center justify-center rounded-full"
          aria-label="Voice call"
        >
          <Phone className="text-muted-foreground size-5" />
        </button>
        <button
          type="button"
          className="hover:bg-accent inline-flex size-9 items-center justify-center rounded-full"
          aria-label="More options"
        >
          <MoreVertical className="text-muted-foreground size-5" />
        </button>
      </div>
    </header>
  );
}

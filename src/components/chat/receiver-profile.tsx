'use client';

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ReceiverProfileProps {
  avatar?: string;
  name?: string;
  email?: string;
  status?: string | null;
}

export function ReceiverProfile({
  avatar,
  name = '',
  email = '',
  status,
}: ReceiverProfileProps) {
  const isOnline = status?.toLowerCase() === 'online';

  return (
    <div className="flex size-full items-center justify-center p-4 sm:p-6">
      <div className="pixel-panel bg-card flex w-full max-w-sm flex-col items-center gap-4 rounded-none px-6 py-8 text-center">
        <Avatar className="size-28">
          <AvatarImage src={avatar} alt={name} />
          <AvatarFallback className="font-pixel text-3xl font-bold">
            {name.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="w-full space-y-1.5">
          <h2 className="font-pixel text-xl font-bold">{name}</h2>
          {email && (
            <p className="text-muted-foreground font-pixel-mono text-xs break-all">
              {email}
            </p>
          )}
          {status && (
            <span
              className={cn(
                'pixel-box mt-2 inline-flex items-center gap-1.5 px-2 py-1',
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
      </div>
    </div>
  );
}

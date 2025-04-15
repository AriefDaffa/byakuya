'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/avatar';
import { BadgeNotif } from '@/components/atoms/badge-notif';
import { cn } from '@/lib/utils';

interface ChatListProps {
  avatar: string;
  name: string;
  message: string;
  time?: string;
  fallback: string;
  unread?: number;
  active?: boolean;
  className?: string;
}

export function ChatList({
  avatar,
  name,
  message,
  time,
  unread,
  fallback,
  active = false,
  className,
}: ChatListProps) {
  return (
    <div
      className={cn(
        'flex items-center border-l-2 border-transparent gap-3 py-2 px-3  cursor-pointer hover:bg-accent relative h-full',
        active && 'bg-accent',
        active && ' border-primary',
        className
      )}
    >
      <Avatar className={`h-12 w-12`}>
        <AvatarImage src={avatar} alt={''} />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h3 className="font-medium truncate">{name}</h3>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {time}
          </span>
        </div>
        <p className="text-sm text-muted-foreground truncate">{message}</p>
      </div>
      <div className="absolute right-2 bottom-4">
        {unread ? <BadgeNotif count={unread} /> : <></>}
      </div>
    </div>
  );
}

'use client';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/avatar';

interface ChatListProps {
  avatar: string;
  name: string;
  message: string;
  time: string;
  fallback: string;
  unread?: number;
  online?: boolean;
  active?: boolean;
  color?: string;
  onClick?: () => void;
  className?: string;
}

export function ChatList({
  avatar,
  name,
  message,
  time,
  //   unread,
  fallback,
  //   online = false,
  active = false,
  //   color = 'bg-blue-500',
  onClick,
  className,
}: ChatListProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2 mt-1 rounded-lg cursor-pointer hover:bg-accent',
        active && 'bg-accent',
        className
      )}
      onClick={onClick}
    >
      <Avatar className={`h-10 w-10`}>
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
      {/* {unread && <BadgeCount count={unread} />} */}
    </div>
  );
}

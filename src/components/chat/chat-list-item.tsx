'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatChatTimestamp } from '@/lib/format';
import type { ChatListItem } from '@/types/chat';

interface ChatListItemComponentProps {
  item: ChatListItem;
  isActive: boolean;
  onClick: () => void;
}

export function ChatListItemComponent({
  item,
  isActive,
  onClick,
}: ChatListItemComponentProps) {
  const { otherUser, lastMessage, unreadCount } = item;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'hover:bg-accent flex h-20 w-full items-center gap-3 border-b border-l-2 border-l-transparent px-3 py-2 text-left transition-colors',
        isActive && 'border-l-primary bg-accent',
      )}
      aria-label={`Chat with ${otherUser?.name}`}
    >
      <Avatar className="size-12">
        <AvatarImage src={otherUser?.avatar_url || ''} alt={otherUser?.name || ''} />
        <AvatarFallback>
          {(otherUser?.name || '?').substring(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <h3 className="truncate font-medium">{otherUser?.name}</h3>
          {lastMessage && (
            <span className="text-muted-foreground text-xs whitespace-nowrap">
              {formatChatTimestamp(lastMessage.created_at)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground truncate text-sm">
            {lastMessage?.content || 'No messages yet'}
          </p>
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground ml-2 inline-flex size-5 items-center justify-center rounded-full text-[10px] font-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

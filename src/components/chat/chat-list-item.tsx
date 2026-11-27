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
  const isOnline = otherUser?.status === 'online';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'hover:bg-accent relative flex h-20 w-full items-center gap-3 border-b border-[var(--pixel-frame)] px-3 py-2 text-left transition-colors',
        isActive && 'bg-accent',
      )}
      aria-label={`Chat with ${otherUser?.name}`}
    >
      {isActive && (
        <span
          className="absolute inset-y-0 left-0 w-[3px] bg-[var(--unread)]"
          aria-hidden="true"
        />
      )}

      <div className="relative shrink-0">
        <Avatar className="size-11">
          <AvatarImage src={otherUser?.avatar_url || ''} alt={otherUser?.name || ''} />
          <AvatarFallback className="font-pixel text-sm font-bold">
            {(otherUser?.name || '?').substring(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {isOnline && (
          <span
            className="absolute -right-0.5 -bottom-0.5 size-2.5 border border-[var(--pixel-frame)] bg-[var(--online)]"
            aria-hidden="true"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-pixel truncate text-sm font-bold">{otherUser?.name}</h3>
          {lastMessage && (
            <span className="text-muted-foreground font-pixel-mono text-[10px] whitespace-nowrap">
              {formatChatTimestamp(lastMessage.created_at)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground font-pixel-mono truncate text-xs">
            {lastMessage?.is_deleted
              ? 'Message deleted'
              : lastMessage?.content || 'No messages yet'}
          </p>
          {unreadCount > 0 && (
            <span className="pixel-box font-pixel-mono ml-1 inline-flex shrink-0 items-center justify-center bg-[var(--unread)] px-1.5 py-0.5 text-[10px] font-bold text-[#090c12]">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

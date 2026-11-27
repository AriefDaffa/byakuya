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
        'hover:bg-accent relative flex h-[76px] w-full items-center gap-3 border-b border-[var(--pixel-frame)] px-3.5 py-2 text-left transition-colors',
        isActive && 'bg-accent',
      )}
      aria-label={`Chat with ${otherUser?.name}`}
    >
      {isActive && (
        <span
          className="absolute inset-y-0 left-0 w-1 bg-[var(--unread)]"
          aria-hidden="true"
        />
      )}

      <div className="relative shrink-0">
        <Avatar className="size-13">
          <AvatarImage src={otherUser?.avatar_url || ''} alt={otherUser?.name || ''} />
          <AvatarFallback>{otherUser?.name || 'Byakuya'}</AvatarFallback>
        </Avatar>
        {isOnline && (
          <span
            className="absolute -right-0.5 -bottom-0.5 size-3 border-2 border-[var(--pixel-frame)] bg-[var(--online)]"
            aria-hidden="true"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate font-sans text-base leading-tight font-semibold">
            {otherUser?.name}
          </h3>
          {lastMessage && (
            <span className="text-muted-foreground font-mono text-[11px] whitespace-nowrap tabular-nums">
              {formatChatTimestamp(lastMessage.created_at)}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="text-muted-foreground truncate font-sans text-sm leading-snug">
            {lastMessage?.is_deleted
              ? 'Message deleted'
              : lastMessage?.content || 'No messages yet'}
          </p>
          {unreadCount > 0 && (
            <span className="pixel-box ml-1 inline-flex h-5 min-w-5 shrink-0 items-center justify-center bg-[var(--unread)] px-1 font-mono text-[11px] font-bold text-[#090c12] tabular-nums">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

'use client';

import { Users } from 'lucide-react';
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
  const { conversation, otherUser, members, lastMessage, unreadCount } = item;
  const isGroup = conversation.type === 'group';
  const displayName = isGroup
    ? conversation.name || 'Group Room'
    : otherUser?.name || 'Byakuya';
  const displayAvatar = isGroup
    ? conversation.avatar_url || ''
    : otherUser?.avatar_url || '';
  const isOnline = !isGroup && otherUser?.status === 'online';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'hover:bg-accent relative flex min-h-[84px] w-full items-center gap-3 border-b-2 border-[#0b0e14]/70 px-4 py-2.5 text-left transition-colors',
        isActive &&
          'bg-[#2c3766] shadow-[inset_0_2px_0_rgba(255,255,255,0.14)] dark:bg-[#2c3766]',
      )}
      aria-label={`Chat with ${displayName}`}
    >
      {isActive && (
        <span
          className="absolute inset-y-0 left-0 w-1.5 bg-[var(--unread)]"
          aria-hidden="true"
        />
      )}

      <div className="relative shrink-0">
        <Avatar className="size-12 border-2 border-[#090c12] shadow-[2px_2px_0_#07090e]">
          <AvatarImage src={displayAvatar} alt={displayName} />
          <AvatarFallback>{displayName}</AvatarFallback>
        </Avatar>
        {isOnline && (
          <span
            className="absolute -right-0.5 -bottom-0.5 size-3.5 border-2 border-[#090c12] bg-[var(--online)]"
            aria-hidden="true"
          />
        )}
        {isGroup && (
          <span
            className="absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center border border-[#090c12] bg-[var(--unread)] text-[#090c12]"
            aria-hidden="true"
          >
            <Users className="size-2.5" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate font-sans text-base leading-tight font-bold">
            {displayName}
          </h3>
          {lastMessage && (
            <span className="text-muted-foreground font-mono text-xs whitespace-nowrap tabular-nums">
              {formatChatTimestamp(lastMessage.created_at)}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="text-muted-foreground truncate font-sans text-sm leading-snug">
            {lastMessage?.is_deleted
              ? 'Message deleted'
              : lastMessage?.content ||
                (isGroup ? `${members?.length ?? 0} members` : 'No messages yet')}
          </p>
          {unreadCount > 0 && (
            <span className="pixel-box ml-1 inline-flex h-6 min-w-6 shrink-0 items-center justify-center bg-[var(--unread)] px-1 font-mono text-xs font-bold text-[#090c12] tabular-nums">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

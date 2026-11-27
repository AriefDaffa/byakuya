'use client';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageBubble } from '@/components/ui/message-bubble';
import { formatChatTimestamp } from '@/lib/format';
import type { MessageGroup } from '@/types/chat';

interface MessageGroupProps extends MessageGroup {
  currentUserId: string;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
}

export function MessageGroupComponent({
  senderId,
  senderName,
  senderAvatar,
  messages,
  currentUserId,
  onEdit,
  onDelete,
}: MessageGroupProps) {
  const isOwn = senderId === currentUserId;

  return (
    <div className="mb-4">
      <div className={cn('flex gap-3', isOwn && 'flex-row-reverse')}>
        <Avatar className="hidden size-10 shrink-0 rounded-none border-2 border-[var(--pixel-frame)] md:block">
          <AvatarImage src={senderAvatar || ''} alt={senderName} />
          <AvatarFallback>{senderName.substring(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div
          className={cn(
            'flex min-w-0 flex-1 flex-col gap-1',
            isOwn ? 'items-end' : 'items-start',
          )}
        >
          <div className="flex items-center gap-2">
            {isOwn ? (
              <>
                <span className="font-pixel-mono text-[10px] opacity-75">
                  {formatChatTimestamp(messages[0]?.created_at)}
                </span>
                <span className="font-pixel text-sm font-semibold">{senderName}</span>
              </>
            ) : (
              <>
                <span className="font-pixel text-sm font-semibold">{senderName}</span>
                <span className="font-pixel-mono text-[10px] opacity-75">
                  {formatChatTimestamp(messages[0]?.created_at)}
                </span>
              </>
            )}
          </div>
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              variant={isOwn ? 'sent' : 'received'}
              onEdit={isOwn ? onEdit : undefined}
              onDelete={isOwn ? onDelete : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageBubble } from '@/components/ui/message-bubble';
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
          {/* Sender name only — timestamps live inside each bubble. */}
          <span className="text-foreground/90 px-1 font-sans text-xs font-semibold tracking-wide">
            {senderName}
          </span>
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

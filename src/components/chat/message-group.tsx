'use client';

import { MessageBubble } from '@/components/ui/message-bubble';
import type { MessageGroup } from '@/types/chat';

interface MessageGroupProps extends MessageGroup {
  currentUserId: string;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
}

/**
 * A run of consecutive messages from one sender. The 1:1 feed intentionally
 * omits external avatars and sender labels so it reads like the reference
 * mock-ups: bubbles (with their internal timestamps) only.
 */
export function MessageGroupComponent({
  senderId,
  messages,
  currentUserId,
  onEdit,
  onDelete,
}: MessageGroupProps) {
  const isOwn = senderId === currentUserId;

  return (
    <div className="flex flex-col gap-2">
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
  );
}

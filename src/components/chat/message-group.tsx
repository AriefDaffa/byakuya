'use client';

import { MessageBubble } from '@/components/ui/message-bubble';
import type { MessageGroup, MessageWithSender } from '@/types/chat';

interface MessageGroupProps extends MessageGroup {
  currentUserId: string;
  isGroupChat?: boolean;
  highlightedMessageId?: string | null;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onReply?: (message: MessageWithSender) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onPin?: (messageId: string) => void;
}

/**
 * A run of consecutive messages from one sender.
 */
export function MessageGroupComponent({
  senderId,
  messages,
  currentUserId,
  isGroupChat = false,
  highlightedMessageId,
  onEdit,
  onDelete,
  onReply,
  onReact,
  onPin,
}: MessageGroupProps) {
  const isOwn = senderId === currentUserId;

  return (
    <div className="flex flex-col gap-2">
      {messages.map((msg, idx) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          variant={isOwn ? 'sent' : 'received'}
          currentUserId={currentUserId}
          showSenderName={isGroupChat && idx === 0}
          isHighlighted={highlightedMessageId === msg.id}
          onEdit={isOwn ? onEdit : undefined}
          onDelete={isOwn ? onDelete : undefined}
          onReply={onReply}
          onReact={onReact}
          onPin={onPin}
        />
      ))}
    </div>
  );
}

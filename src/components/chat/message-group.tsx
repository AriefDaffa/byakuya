'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageBubble } from '@/components/ui/message-bubble';
import { formatChatTimestamp } from '@/lib/format';
import type { MessageGroup } from '@/types/chat';
import { useEffect, useRef } from 'react';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="mb-4" ref={messagesEndRef}>
      <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
        <Avatar className="hidden size-10 md:block">
          <AvatarImage src={senderAvatar || ''} alt={senderName} />
          <AvatarFallback>{senderName.substring(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className={`flex max-w-[80%] flex-col gap-1 ${isOwn ? 'items-end' : ''}`}>
          <div className="flex items-center gap-2">
            {isOwn ? (
              <>
                <span className="text-muted-foreground text-xs">
                  {formatChatTimestamp(messages[0]?.created_at)}
                </span>
                <span className="font-semibold">{senderName}</span>
              </>
            ) : (
              <>
                <span className="font-semibold">{senderName}</span>
                <span className="text-muted-foreground text-xs">
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

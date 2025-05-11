import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/avatar';
import { MessageBubble } from '@/components/atoms/message-bubble';
import { FormattedMsg } from '@/types/PrivateChatResponse';
import { formatChatTimestamp } from '@/utils/formatChatTimestamp';
import { FC, useEffect, useRef } from 'react';

interface MessagesProps extends FormattedMsg {
  currentUserId: string;
}

const Messages: FC<MessagesProps> = ({
  id,
  image,
  name,
  messages,
  currentUserId,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="mb-4">
      <div
        className={`flex gap-3 ${
          id === currentUserId ? 'flex-row-reverse' : ''
        }`}
      >
        <Avatar className="h-10 w-10 hidden md:block">
          <AvatarImage src={image} alt={name} />
          <AvatarFallback>{name.substring(0, 1)}</AvatarFallback>
        </Avatar>
        <div
          className={`flex flex-col gap-1 max-w-[80%] ${
            id === currentUserId ? 'items-end' : ''
          }`}
        >
          <div className="flex items-center gap-2">
            {id === currentUserId ? (
              <>
                <span className="text-xs text-muted-foreground">
                  {formatChatTimestamp(messages[0]?.createdAt)}
                </span>
                <span className="font-semibold">{name}</span>
              </>
            ) : (
              <>
                <span className="font-semibold">{name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatChatTimestamp(messages[0]?.createdAt)}
                </span>
              </>
            )}
          </div>
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              variant={id === currentUserId ? 'sent' : 'received'}
            >
              {msg.content}
            </MessageBubble>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Messages;

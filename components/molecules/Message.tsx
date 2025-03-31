import type { ReactNode } from 'react';
import Link from 'next/link';

import { MessageBubble } from '../atoms/message-bubble';
import { Avatar, AvatarFallback, AvatarImage } from '../atoms/avatar';

interface MessageProps {
  sender: string;
  avatar: string;
  time: string;
  content: ReactNode;
  mentions?: string[];
  isSelf?: boolean;
  className?: string;
}

const Message = ({
  sender,
  avatar,
  time,
  content,
  mentions,
  isSelf = false,
  className,
}: MessageProps) => {
  return (
    <div
      className={`flex gap-3 my-3 ${
        isSelf ? 'flex-row-reverse' : ''
      } ${className}`}
    >
      <Avatar className={`h-10 w-10`}>
        <AvatarImage src={avatar} alt={''} />
        <AvatarFallback>{sender.substring(0, 1)}</AvatarFallback>
      </Avatar>
      <div
        className={`flex flex-col gap-1 max-w-[80%] ${
          isSelf ? 'items-end' : ''
        }`}
      >
        <div className="flex items-center gap-2">
          {isSelf ? (
            <>
              <span className="text-xs text-muted-foreground">{time}</span>
              <span className="font-semibold">{sender}</span>
            </>
          ) : (
            <>
              <span className="font-semibold">{sender}</span>
              <span className="text-xs text-muted-foreground">{time}</span>
            </>
          )}
        </div>
        <MessageBubble variant={isSelf ? 'sent' : 'received'}>
          {content}
        </MessageBubble>
        {mentions && mentions.length > 0 && (
          <div className="flex gap-1 mt-1">
            {mentions.map((mention, index) => (
              <Link key={index} href="#" className="text-primary">
                @{mention}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;

'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/avatar';
import { cn } from '@/lib/utils';
import { ChatListData } from '@/types/ChatListTypes';
import { formatChatTimestamp } from '@/utils/formatChatTimestamp';
import { FC } from 'react';

interface ChatListProps extends ChatListData {
  active: boolean;
}

const ChatList: FC<ChatListProps> = ({
  active,
  image,
  name,
  latestMessage,
}) => {
  return (
    <div
      className={cn(
        'flex items-center border-l-2 border-transparent gap-3 py-2 px-3  cursor-pointer hover:bg-accent relative h-full',
        active && 'bg-accent',
        active && ' border-primary'
        // className
      )}
    >
      <Avatar className={`h-12 w-12`}>
        <AvatarImage src={image} alt={''} />
        <AvatarFallback>{name.substring(0, 1)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h3 className="font-medium truncate">{name}</h3>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatChatTimestamp(latestMessage.createdAt)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {latestMessage.content}
        </p>
      </div>
      {/* <div className="absolute right-2 bottom-4">
        {unread ? <BadgeNotif count={unread} /> : <></>}
      </div> */}
    </div>
  );
};

export default ChatList;

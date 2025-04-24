'use client';
import { Button } from '@/components/atoms/button';

import { Input } from '@/components/atoms/input';
import { ScrollArea } from '@/components/atoms/scroll-area';
import { Skeleton } from '@/components/atoms/skeleton';
import { ChatList } from '@/components/molecules/ChatList';
import { ChatListType } from '@/types/ChatListTypes';
import { formatChatTimestamp } from '@/utils/formatChatTimestamp';
import { CircleSlash2, MessageSquarePlus } from 'lucide-react';
import { Dispatch, FC, SetStateAction } from 'react';
import SidebarHeader from '../molecules/SidebarHeader';

interface ChatSidebarProps {
  isLoading: boolean;
  chatList: ChatListType[];
  onChatSelect: (data: ChatListType) => void;
  setOpenDialog: Dispatch<SetStateAction<boolean>>;
  userName?: string;
  avatar?: string;
  selectedChatId?: string;
  handleOpenChatMob: () => void;
}

const ChatSidebar: FC<ChatSidebarProps> = ({
  isLoading,
  chatList = [],
  onChatSelect,
  userName,
  selectedChatId,
  // avatar,
  setOpenDialog,
  handleOpenChatMob,
}) => {
  return (
    <div className="relative size-full flex flex-col border-l border-b border-r">
      <div className="border-b px-3 pt-6 pb-4 space-y-4">
        <SidebarHeader userName={userName} />
        <Input placeholder="Search here..." />
      </div>
      {isLoading ? (
        Array.from(Array(5), (_, i) => (
          <div
            key={i}
            className={
              'flex items-center gap-3 p-2 mt-1 rounded-lg cursor-pointer hover:bg-accent relative'
            }
          >
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-10" />
              </div>
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))
      ) : chatList.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <div className="space-y-2 text-center px-4">
            <div className="flex justify-center mb-4">
              <CircleSlash2 className="w-20 h-20 text-muted-foreground" />
            </div>
            <div className="text-xl font-semibold">Your inbox is empty</div>
            <div className="text-sm text-muted-foreground">
              Once you start a conversation, you&apos;ll see it listed here
            </div>
          </div>
        </div>
      ) : (
        <ScrollArea className="size-full" type="auto">
          <div className="absolute inset-0">
            {chatList.map((item, idx) => (
              <div
                onClick={() => {
                  onChatSelect(item);
                  handleOpenChatMob();
                }}
                key={idx}
                className="border-b h-20"
              >
                <ChatList
                  avatar={item.user.image || ''}
                  name={item.user.name}
                  message={item.latestMessage?.content}
                  time={
                    item.latestMessage
                      ? formatChatTimestamp(item.latestMessage?.createdAt)
                      : ''
                  }
                  unread={item.unreadCount}
                  fallback={item.user.name.charAt(0)}
                  active={selectedChatId === item.user.id}
                />
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
      <Button
        onClick={() => setOpenDialog(true)}
        className="absolute right-3 bottom-3 rounded-full h-12 w-12 "
      >
        <MessageSquarePlus className="h-10 w-10" />
      </Button>
    </div>
  );
};

export default ChatSidebar;

'use client';
import { Button } from '@/components/atoms/button';

import { Input } from '@/components/atoms/input';
import { ScrollArea } from '@/components/atoms/scroll-area';
import { ChatList } from '@/components/molecules/ChatList';
import { ChatListType } from '@/types/ChatListTypes';
import { SidebarMergedData } from '@/types/SidebarSearchTypes';
import { formatChatTimestamp } from '@/utils/formatChatTimestamp';
import { MessageSquarePlus } from 'lucide-react';
import { Dispatch, FC, SetStateAction } from 'react';
import Empty from '../atoms/empty';
import Loader from '../atoms/loader';
import SidebarHeader from '../molecules/SidebarHeader';

interface ChatSidebarProps {
  isLoading: boolean;
  chatList: ChatListType[];
  onChatSelect: (data: ChatListType) => void;
  setOpenDialog: Dispatch<SetStateAction<boolean>>;
  sidebarkeyword: string;
  setSidebarKeyword: Dispatch<SetStateAction<string>>;
  isSearching: boolean;
  userName?: string;
  avatar?: string;
  selectedChatId?: string;
  handleOpenChatMob: () => void;
  searchResult?: SidebarMergedData;
}

const ChatSidebar: FC<ChatSidebarProps> = ({
  isLoading,
  chatList = [],
  onChatSelect,
  userName,
  selectedChatId,
  setOpenDialog,
  handleOpenChatMob,
  sidebarkeyword,
  setSidebarKeyword,
  isSearching,
  searchResult,
}) => {
  return (
    <div className="relative size-full flex flex-col border-l border-b border-r">
      <div className="border-b px-3 pt-6 pb-4 space-y-4">
        <SidebarHeader userName={userName} />
        <Input
          value={sidebarkeyword}
          onChange={(e) => setSidebarKeyword(e.target.value)}
          placeholder="Search user or messages here..."
        />
      </div>

      {sidebarkeyword !== '' ? (
        isSearching ? (
          <Loader />
        ) : (
          <ScrollArea className="size-full" type="auto">
            <div className="absolute inset-0">
              <div>
                <div className="uppercase text-xs text-muted-foreground p-4 border-b font-semibold">
                  Messages
                </div>
                {searchResult?.messages.map((item, idx) => (
                  <div
                    onClick={() => {
                      handleOpenChatMob();
                    }}
                    key={idx}
                    className="border-b h-20"
                  >
                    <ChatList
                      avatar={item.userImage || ''}
                      name={item.userName}
                      message={item.content}
                      time={
                        item.createdAt
                          ? formatChatTimestamp(item.createdAt)
                          : ''
                      }
                      fallback={item.userName.charAt(0)}
                    />
                  </div>
                ))}
              </div>
              <div>
                <div className="uppercase text-xs text-muted-foreground p-4 border-b font-semibold">
                  Users
                </div>
                {searchResult?.users.map((item, idx) => (
                  <div
                    onClick={() => {
                      handleOpenChatMob();
                    }}
                    key={idx}
                    className="border-b h-20"
                  >
                    <ChatList
                      avatar={item.image || ''}
                      name={item.name}
                      message={''}
                      fallback={item.name.charAt(0)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        )
      ) : isLoading ? (
        <Loader />
      ) : chatList.length === 0 ? (
        <Empty
          title="Chat Empty"
          subTitle="Once you start a conversation, you'll see it listed here"
        />
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

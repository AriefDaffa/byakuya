import { ScrollArea } from '@/components/atoms/scroll-area';
import { ChatList } from '@/components/molecules/ChatList';
import SearchInput from '@/components/molecules/SearchInput';
import { ChatListType } from '@/types/ChatListTypes';
import { formatTime } from '@/utils/formatTime';
import { CircleSlash2 } from 'lucide-react';
import { FC } from 'react';
import AppOptions from '../molecules/AppOptions';

interface ChatSidebarProps {
  isLoading: boolean;
  chats: ChatListType[];
}

const ChatSidebar: FC<ChatSidebarProps> = ({ chats = [], isLoading }) => {
  return (
    <div className="w-80 border-r flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">Messages</h1>
          <AppOptions />
        </div>
        <div className="mt-4">
          <SearchInput placeholder="Search messages..." />
        </div>
      </div>

      {isLoading ? (
        <></>
      ) : chats.length < 1 ? (
        <div className="size-full flex items-center justify-center">
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
        <ScrollArea className="flex-1 h-1">
          <div className="p-2">
            <div className="text-xs text-muted-foreground px-2 py-1 mt-4">
              <span>All Message</span>
            </div>
            {chats.map((item, idx) => (
              <ChatList
                key={idx}
                avatar={item.users[0].image || ''}
                name={item.type === 'group' ? '' : item.users[0].name}
                message={item.latestMessage.content}
                time={formatTime(item.latestMessage.createdAt)}
                unread={item.unreadCount}
                fallback={item.users[0].name.charAt(0)}
              />
            ))}
          </div>
        </ScrollArea>
      )}

      {/*  */}
    </div>
  );
};

export default ChatSidebar;

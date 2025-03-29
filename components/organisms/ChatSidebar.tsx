import { ScrollArea } from '@/components/atoms/scroll-area';
import { ChatList } from '@/components/molecules/ChatList';
import SearchInput from '@/components/molecules/SearchInput';
// import { ModeToggle } from '../atoms/mode-toggle';
import AppOptions from '../molecules/AppOptions';
import { CircleSlash2 } from 'lucide-react';
import { FC } from 'react';
import { IChatListTypes } from '@/types/ChatListTypes';

interface ChatSidebarProps extends IChatListTypes {
  isLoading: boolean;
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
                avatar={item.avatar}
                name={item.name}
                message={item.message}
                time={item.time}
                online
                fallback={item.fallback}
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

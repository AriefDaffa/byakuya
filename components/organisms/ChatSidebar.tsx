'use client';

import { Input } from '@/components/atoms/input';
import { ScrollArea } from '@/components/atoms/scroll-area';
import { ChatList } from '@/components/molecules/ChatList';
import { useChatList } from '@/hooks/useChatList';
import { useSidebarSearch } from '@/hooks/pages/Chat/useSidebarSearch';
import { authClient } from '@/lib/auth-client';
import { useChatStore } from '@/store/useChatStore';
import { formatChatTimestamp } from '@/utils/formatChatTimestamp';
import { useMediaQuery } from '@mantine/hooks';
import { FC } from 'react';
import Empty from '../atoms/empty';
import Loader from '../atoms/loader';
import SidebarHeader from '../molecules/SidebarHeader';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ChatSidebarProps {}

const ChatSidebar: FC<ChatSidebarProps> = ({}) => {
  const { useSession } = authClient;
  const { data: session } = useSession();

  const matches = useMediaQuery('(min-width: 768px)');

  const { chatList, loading } = useChatList();
  const {
    data: searchResult,
    loading: isSearching,
    setSidebarKeyword,
    sidebarKeyword,
  } = useSidebarSearch();
  const { setSelectedRoom, selectedRoom, setOpenChatSlider } = useChatStore();

  return (
    <div className="relative size-full flex flex-col border-l border-b border-r">
      <div className="border-b px-3 pt-6 pb-4 space-y-4">
        <SidebarHeader userName={session?.user.name} />
        <Input
          value={sidebarKeyword}
          onChange={(e) => setSidebarKeyword(e.target.value)}
          placeholder="Search user or messages here..."
        />
      </div>

      {sidebarKeyword !== '' ? (
        isSearching ? (
          <Loader />
        ) : (
          <ScrollArea className="size-full" type="auto">
            <div className="absolute inset-0">
              {searchResult.messages.length === 0 &&
                searchResult.users.length === 0 && <Empty title="Not found" />}
              {searchResult.messages.length > 0 && (
                <div>
                  <div className="uppercase text-xs text-muted-foreground p-4 border-b font-semibold">
                    Messages
                  </div>
                  {searchResult?.messages.map((item, idx) => (
                    <div onClick={() => {}} key={idx} className="border-b h-20">
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
              )}
              {searchResult.users.length > 0 && (
                <div>
                  <div className="uppercase text-xs text-muted-foreground p-4 border-b font-semibold">
                    Users
                  </div>
                  {searchResult?.users.map((item, idx) => (
                    <div onClick={() => {}} key={idx} className="border-b h-20">
                      <ChatList
                        avatar={item.image || ''}
                        name={item.name}
                        message={''}
                        fallback={item.name.charAt(0)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        )
      ) : loading ? (
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
                  setSelectedRoom({
                    roomId: item.id,
                    user: item.user,
                  });

                  if (!matches) {
                    setOpenChatSlider();
                  }
                }}
                key={idx}
                className="border-b h-20"
              >
                <ChatList
                  avatar={item.user.image || ''}
                  name={item.user.name}
                  message={item.latestMessage?.content}
                  unread={item.unreadCount}
                  fallback={item.user.name.charAt(0)}
                  active={selectedRoom.user.id === item.user.id}
                  time={
                    item.latestMessage
                      ? formatChatTimestamp(item.latestMessage?.createdAt)
                      : ''
                  }
                />
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default ChatSidebar;

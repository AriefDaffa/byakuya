'use client';

import Empty from '@/components/atoms/empty';
import { Input } from '@/components/atoms/input';
import Loader from '@/components/atoms/loader';
import { ScrollArea } from '@/components/atoms/scroll-area';
import ChatList from '@/components/molecules/ChatList';
import SidebarHeader from '@/components/molecules/SidebarHeader';
import { useChatList } from '@/hooks/useChatList';
import { useChatSearch } from '@/hooks/useChatSearch';
import { authClient } from '@/lib/auth-client';
import { useChatListStore } from '@/store/useChatListStore';
import { useChatStore } from '@/store/useChatStore';
import { useMediaQuery } from '@mantine/hooks';
import { X } from 'lucide-react';
import { FC } from 'react';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ChatSidebarProps {}

const ChatSidebar: FC<ChatSidebarProps> = ({}) => {
  const { useSession } = authClient;
  const { data: session } = useSession();

  const matches = useMediaQuery('(min-width: 768px)');

  const { data, isLoading } = useChatList();
  const {
    data: mergedData,
    onSearch,
    isLoading: isSearching,
  } = useChatSearch();

  const { searchKeyword, setSearchKeyword } = useChatListStore();
  const { setSelectedUser, selectedUser, setOpenChatSlider } = useChatStore();

  return (
    <div className="relative size-full flex flex-col border-l border-b border-r">
      <div className="border-b px-3 pt-6 pb-4 space-y-4">
        <SidebarHeader userName={session?.user.name} />
        <div className="w-full relative">
          <Input
            value={searchKeyword}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search user or messages here..."
          />
          {searchKeyword !== '' && (
            <X
              className="absolute right-2 top-0 bottom-0 my-auto text-muted-foreground cursor-pointer"
              size={18}
              onClick={() => setSearchKeyword('')}
            />
          )}
        </div>
      </div>
      {searchKeyword !== '' ? (
        <>
          {isSearching ? (
            <Loader />
          ) : (
            <ScrollArea className="size-full" type="auto">
              <div className="absolute inset-0">
                {mergedData.messages.length > 0 && (
                  <>
                    <div className="uppercase text-xs text-muted-foreground p-4 border-b font-semibold">
                      Users
                    </div>
                    {mergedData.messages.map((item, idx) => (
                      <div
                        onClick={() => {
                          setSelectedUser(item);

                          if (!matches) {
                            setOpenChatSlider();
                          }
                        }}
                        key={idx}
                        className="border-b h-20"
                      >
                        <ChatList
                          active={selectedUser.id === item.id}
                          latestMessage={{
                            content: item.content,
                            createdAt: item.createdAt,
                            id: '',
                          }}
                          {...item}
                        />
                      </div>
                    ))}
                  </>
                )}
                {mergedData.users.length > 0 && (
                  <>
                    <div className="uppercase text-xs text-muted-foreground p-4 border-b font-semibold">
                      Users
                    </div>
                    {mergedData.users.map((item, idx) => (
                      <div
                        onClick={() => {
                          setSelectedUser(item);

                          if (!matches) {
                            setOpenChatSlider();
                          }
                        }}
                        key={idx}
                        className="border-b h-20"
                      >
                        <ChatList
                          active={selectedUser.id === item.id}
                          latestMessage={{ content: '', createdAt: '', id: '' }}
                          {...item}
                        />
                      </div>
                    ))}
                  </>
                )}
              </div>
            </ScrollArea>
          )}
        </>
      ) : (
        <>
          {isLoading ? (
            <Loader />
          ) : data.length === 0 ? (
            <Empty
              title="Chat Empty"
              subTitle="Once you start a conversation, you'll see it listed here"
            />
          ) : (
            <ScrollArea className="size-full" type="auto">
              <div className="absolute inset-0">
                {data.map((item, idx) => (
                  <div
                    onClick={() => {
                      setSelectedUser(item);

                      if (!matches) {
                        setOpenChatSlider();
                      }
                    }}
                    key={idx}
                    className="border-b h-20"
                  >
                    <ChatList active={selectedUser.id === item.id} {...item} />
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </>
      )}
    </div>
  );
};

export default ChatSidebar;

'use client';

import { Input } from '@/components/atoms/input';
import { ScrollArea } from '@/components/atoms/scroll-area';
import ChatList from '@/components/molecules/ChatList';
// import { useChatList } from '@/hooks/useChatList';
// import { useSidebarSearch } from '@/hooks/pages/Chat/useSidebarSearch';
import Empty from '@/components/atoms/empty';
import Loader from '@/components/atoms/loader';
import SidebarHeader from '@/components/molecules/SidebarHeader';
import { useChatList } from '@/hooks/useChatList';
import { useChatSearch } from '@/hooks/useChatSearch';
import { authClient } from '@/lib/auth-client';
import { useChatListStore } from '@/store/useChatListStore';
import { useChatStore } from '@/store/useChatStore';
import { useMediaQuery } from '@mantine/hooks';
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

  const { searchKeyword } = useChatListStore();
  const { setSelectedUser, selectedUser, setOpenChatSlider } = useChatStore();

  return (
    <div className="relative size-full flex flex-col border-l border-b border-r">
      <div className="border-b px-3 pt-6 pb-4 space-y-4">
        <SidebarHeader userName={session?.user.name} />
        <Input
          value={searchKeyword}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search user or messages here..."
        />
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
      {/* {searchKeyword !== '' ? (
        isLoading ? (
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
                  active={selectedUser.id === item.user.id}
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
      )} */}
    </div>
  );
};

export default ChatSidebar;

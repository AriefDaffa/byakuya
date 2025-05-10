import { Button } from '@/components/atoms/button';
import { ScrollArea } from '@/components/atoms/scroll-area';
import ChatHeader from '@/components/molecules/ChatHeader';
import Message from '@/components/molecules/Message';
import MessageInput from '@/components/molecules/MessageInput';
import { useChatRoom } from '@/hooks/pages/Chat/useChatRoom';
import { authClient } from '@/lib/auth-client';
import { getMessages } from '@/services/getMessages';
import { useChatStore } from '@/store/useChatStore';
import { useQuery } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useEffect, useMemo, type FC } from 'react';

interface ChatSectionProps {
  openProfile: boolean;
  handleOpenProfile: () => void;
  withHeader?: boolean;
}

const ChatSection: FC<ChatSectionProps> = ({
  handleOpenProfile,
  withHeader = true,
}) => {
  const { useSession } = authClient;
  const { data: session } = useSession();

  const {
    selectedRoom,
    messageKeyword,
    setMessageKeyword,
    // data,
    // fetchMessages,
    // isLoading,
  } = useChatStore();

  const {
    // loading,
    // formattedMessages,
    data,
    isError,
    isLoading,
    formattedMessages,
  } = useChatRoom();

  return (
    <div className="relative size-full border-r border-b">
      {selectedRoom.user.name === '' ? (
        <div className="size-full flex items-center justify-center text-muted-foreground">
          Select chat to start
        </div>
      ) : (
        <div className="flex flex-col size-full">
          {withHeader && (
            <ChatHeader
              avatar={selectedRoom?.user.image || ''}
              name={selectedRoom?.user.name || ''}
              handleOpenProfile={handleOpenProfile}
              status=""
            />
          )}
          <div className={`flex-1 `}>
            {isLoading ? (
              <div className="size-full flex items-center justify-center">
                <LoaderCircle className="animate-spin" />
              </div>
            ) : (
              <ScrollArea className="size-full" type="auto">
                <div className="absolute inset-0 p-2">
                  {data.data.pagination.currentPage <
                    data.data.pagination.totalPages && (
                    <div className="w-full flex items-center justify-center">
                      <Button
                        // onClick={loadMore}
                        className="rounded-full"
                        variant="outline"
                        // disabled={loadingOlderMessages}
                      >
                        {/* {loadingOlderMessages
                          ? 'Loading...'
                          : 'Load more messages'} */}
                      </Button>
                    </div>
                  )}
                  {/* <Message messages={formattedMessages} /> */}
                </div>
              </ScrollArea>
            )}
          </div>
          <MessageInput
            msg={messageKeyword}
            setMsg={setMessageKeyword}
            // handleMessageSent={handleSubmitMessage}
          />
        </div>
      )}
    </div>
  );
};

export default ChatSection;

import { Button } from '@/components/atoms/button';
import { ScrollArea } from '@/components/atoms/scroll-area';
import ChatHeader from '@/components/molecules/ChatHeader';
import MessageInput from '@/components/molecules/MessageInput';
import Messages from '@/components/molecules/Messages';
import { useChatRoom } from '@/hooks/useChatRoom';
import { authClient } from '@/lib/auth-client';
import { useChatStore } from '@/store/useChatStore';
import { LoaderCircle } from 'lucide-react';
import { useEffect, useRef, type FC } from 'react';

interface ChatSectionProps {
  withHeader?: boolean;
}

const ChatSection: FC<ChatSectionProps> = ({ withHeader = true }) => {
  const { useSession } = authClient;
  const { data: session } = useSession();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    selectedRoom,
    messageKeyword,
    setMessageKeyword,
    setOpenProfile,
    incrementPage,
  } = useChatStore();

  const { data, messages, isLoading, formatMessage, sendMessage, isFetching } =
    useChatRoom();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

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
              handleOpenProfile={setOpenProfile}
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
                  {data.data.currentPage < data.data.totalPages && (
                    <div className="w-full flex items-center justify-center">
                      <Button
                        onClick={incrementPage}
                        className="rounded-full"
                        variant="outline"
                        disabled={isFetching}
                      >
                        {isFetching ? 'Loading...' : 'Load more messages'}
                      </Button>
                    </div>
                  )}
                  {formatMessage(messages).map((item, idx) => (
                    <Messages
                      key={idx}
                      currentUserId={session?.user.id || ''}
                      {...item}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            )}
          </div>
          <MessageInput
            msg={messageKeyword}
            setMsg={setMessageKeyword}
            handleMessageSent={sendMessage}
          />
        </div>
      )}
    </div>
  );
};

export default ChatSection;

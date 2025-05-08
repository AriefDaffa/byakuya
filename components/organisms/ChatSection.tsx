import { Button } from '@/components/atoms/button';
import { ScrollArea } from '@/components/atoms/scroll-area';
import ChatHeader from '@/components/molecules/ChatHeader';
import MessageInput from '@/components/molecules/MessageInput';
import { useFetchMessages } from '@/hooks/fetch/useFetchMessages';
import { authClient } from '@/lib/auth-client';
import { useChatListStore } from '@/store/useChatListStore';
import { useChatStore } from '@/store/useChatStore';
import { LoaderCircle } from 'lucide-react';
import { useCallback, useMemo, type FC } from 'react';
import Message from '../molecules/Message';

interface ChatSectionProps {
  openProfile: boolean;
  loadingOlderMessages: boolean;
  hasNextPage: boolean;
  handleOpenProfile: () => void;
  loadMore: () => void;

  withHeader?: boolean;
}

const ChatSection: FC<ChatSectionProps> = ({
  handleOpenProfile,
  hasNextPage,
  loadMore,
  loadingOlderMessages,
  withHeader = true,
}) => {
  const { useSession } = authClient;
  const { data: session } = useSession();

  const { selectedRoom, messageKeyword, setMessageKeyword } = useChatStore();
  const { prependOrUpdateChat } = useChatListStore();

  const { messages, receiver, loading } = useFetchMessages(
    selectedRoom.roomId,
    selectedRoom.user.id
  );

  const handleSubmitMessage = useCallback(() => {
    // sendMessage(messageKeyword, session?.user.id || '');
    setMessageKeyword('');

    if (selectedRoom && session?.user.id) {
      prependOrUpdateChat({
        id: selectedRoom.roomId,
        type: 'private',
        user: selectedRoom.user,
        unreadCount: 0,
        latestMessage: {
          id: 'temp-id-' + Date.now(),
          senderId: session.user.id,
          content: messageKeyword,
          createdAt: new Date().toISOString(),
          privateChatId: selectedRoom.roomId,
          groupChatId: null,
          userId: session.user.id,
        },
      });
    }
  }, [
    messageKeyword,
    prependOrUpdateChat,
    selectedRoom,
    session?.user.id,
    setMessageKeyword,
  ]);

  const formattedMessages = useMemo(() => {
    const findReceiver = receiver.find(
      (el) => el.user.id !== session?.user.id
    )?.user;

    return messages
      .map((item) => ({
        id: item.id,
        sender:
          item.senderId === session?.user.id ? 'You' : findReceiver?.name || '',
        avatar:
          item.senderId === session?.user.id
            ? session.user.image || ''
            : findReceiver?.image || '',
        time: item.createdAt,
        content: item.content,
        isSelf: item.senderId === session?.user.id,
      }))
      .reverse();
  }, [messages, receiver, session]);

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
            {loading ? (
              <div className="size-full flex items-center justify-center">
                <LoaderCircle className="animate-spin" />
              </div>
            ) : (
              <ScrollArea className="size-full" type="auto">
                <div className="absolute inset-0 p-2">
                  {hasNextPage && (
                    <div className="w-full flex items-center justify-center">
                      <Button
                        onClick={loadMore}
                        className="rounded-full"
                        variant="outline"
                        disabled={loadingOlderMessages}
                      >
                        {loadingOlderMessages
                          ? 'Loading...'
                          : 'Load more messages'}
                      </Button>
                    </div>
                  )}
                  <Message messages={formattedMessages} />
                </div>
              </ScrollArea>
            )}
          </div>
          <MessageInput
            msg={messageKeyword}
            setMsg={setMessageKeyword}
            handleMessageSent={handleSubmitMessage}
          />
        </div>
      )}
    </div>
  );
};

export default ChatSection;

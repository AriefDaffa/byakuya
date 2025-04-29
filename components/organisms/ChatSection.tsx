import { ScrollArea } from '@/components/atoms/scroll-area';
import ChatHeader from '@/components/molecules/ChatHeader';
import Message from '@/components/molecules/Message';
import MessageInput from '@/components/molecules/MessageInput';
import { SelectedUser } from '@/types/SelectUserTypes';
import { LoaderCircle } from 'lucide-react';
import type { Dispatch, FC, SetStateAction } from 'react';
import { Button } from '../atoms/button';

interface ChatSectionProps {
  isLoading: boolean;
  formattedMessages: {
    id: string;
    sender: string;
    avatar: string;
    time: string;
    content: string;
    isSelf?: boolean;
  }[];
  chatInput: string;
  openProfile: boolean;
  loadingOlderMessages: boolean;
  hasNextPage: boolean;
  handleMessageSent: () => void;
  handleOpenProfile: () => void;
  loadMore: () => void;
  setChatInput: Dispatch<SetStateAction<string>>;
  selectedRoom?: SelectedUser;
  withHeader?: boolean;
}

const ChatSection: FC<ChatSectionProps> = ({
  isLoading,
  formattedMessages,
  chatInput,
  setChatInput,
  handleMessageSent,
  selectedRoom,
  handleOpenProfile,
  hasNextPage,
  loadMore,
  loadingOlderMessages,
  withHeader = true,
}) => {
  return (
    <div className="relative size-full border-r border-b">
      {!selectedRoom ? (
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
            msg={chatInput}
            setMsg={setChatInput}
            handleMessageSent={handleMessageSent}
          />
        </div>
      )}
    </div>
  );
};

export default ChatSection;

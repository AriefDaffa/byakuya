import { ScrollArea } from '@/components/atoms/scroll-area';
import ChatHeader from '@/components/molecules/ChatHeader';
import Message from '@/components/molecules/Message';
import MessageInput from '@/components/molecules/MessageInput';
import { SelectedUser } from '@/types/SelectUserTypes';
import { LoaderCircle } from 'lucide-react';
import type { Dispatch, FC, SetStateAction } from 'react';

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
  selectedRoom?: SelectedUser;
  handleMessageSent: () => void;
  setChatInput: Dispatch<SetStateAction<string>>;
}

const ChatSection: FC<ChatSectionProps> = ({
  isLoading,
  formattedMessages,
  chatInput,
  setChatInput,
  handleMessageSent,
  selectedRoom,
}) => {
  return (
    <div className="relative size-full border-r border-b">
      {!selectedRoom ? (
        <div className="size-full flex items-center justify-center">
          Select chat to start
        </div>
      ) : (
        <div className="flex flex-col size-full">
          <ChatHeader
            avatar={selectedRoom?.user.image || ''}
            name={selectedRoom?.user.name || ''}
            status=""
          />
          <div className={`flex-1 `}>
            {isLoading ? (
              <div className="size-full flex items-center justify-center">
                <LoaderCircle className="animate-spin" />
              </div>
            ) : (
              <ScrollArea className="size-full" type="auto">
                <div className="absolute inset-0 p-2">
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

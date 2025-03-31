import { ScrollArea } from '@/components/atoms/scroll-area';
import ChatHeader from '@/components/molecules/ChatHeader';
import Message from '@/components/molecules/Message';
import MessageInput from '@/components/molecules/MessageInput';
import { ChatListType } from '@/types/ChatListTypes';
import { MessageTypes, Receiver } from '@/types/ChatMessageTypes';
import type { Dispatch, FC, SetStateAction } from 'react';

interface ChatSectionProps {
  isLoading: boolean;
  userId: string;
  msg: string;
  setMsg: Dispatch<SetStateAction<string>>;
  user?: ChatListType;
  messages: MessageTypes[];
  receiver: Receiver[];
  handleMessageSent: () => void;
}

const ChatSection: FC<ChatSectionProps> = ({
  user,
  isLoading,
  messages,
  userId,
  msg,
  setMsg,
  handleMessageSent,
  receiver,
}) => {
  console.log(receiver);

  const formattedMessages = messages
    .map((item) => ({
      id: item.id,
      sender:
        item.senderId === userId
          ? 'You'
          : receiver.find((el) => el.user.id !== userId)?.user.name || '',
      avatar: '',
      time: item.createdAt,
      content: item.content,
      isSelf: item.senderId === userId,
    }))
    .reverse();

  return (
    <>
      {isLoading ? (
        <div className="size-full flex items-center justify-center">
          Select chat to start
        </div>
      ) : (
        <>
          <ChatHeader
            name={user?.type === 'private' ? user.users[0].name : ''}
            status=""
            avatar="/placeholder.svg?height=40&width=40"
          />
          <div className={`flex-1 flex flex-col overflow-hidden`}>
            <ScrollArea className="flex-1 px-4 h-1">
              <Message messages={formattedMessages} />
            </ScrollArea>
          </div>
          <MessageInput
            msg={msg}
            setMsg={setMsg}
            handleMessageSent={handleMessageSent}
          />
        </>
      )}
    </>
  );
};

export default ChatSection;

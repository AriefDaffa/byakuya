import { ScrollArea } from '@/components/atoms/scroll-area';
import ChatHeader from '@/components/molecules/ChatHeader';
import Message from '@/components/molecules/Message';
import MessageInput from '@/components/molecules/MessageInput';
import { ChatListType } from '@/types/ChatListTypes';
import { MessageTypes } from '@/types/ChatMessageTypes';
import { formatChatTimestamp } from '@/utils/formatChatTimestamp';
import type { FC } from 'react';

interface ChatSectionProps {
  isLoading: boolean;
  userId: string;
  user?: ChatListType;
  messages: MessageTypes[];
}

const ChatSection: FC<ChatSectionProps> = ({
  user,
  isLoading,
  messages,
  userId,
}) => {
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
              {isLoading ? (
                <></>
              ) : (
                messages.map((item, idx) => (
                  <Message
                    key={idx}
                    sender={
                      item.senderId === userId
                        ? 'You'
                        : item.seenBy.find((el) => el.userId === item.senderId)
                            ?.user.name || ''
                    }
                    avatar=""
                    isSelf={item.senderId === userId}
                    time={formatChatTimestamp(item.createdAt)}
                    content={item.content}
                  />
                ))
              )}
              {/* <div className="flex flex-col gap-6">
                <div className="text-center text-sm text-muted-foreground">
                  Today, April 11
                </div>

                <Message
                  sender="Raulll"
                  avatar="/placeholder.svg?height=40&width=40"
                  time="09:18 AM"
                  content={<p>Guysss cek Figmaku dong, minta feedbacknyaa</p>}
                  mentions={['Momon', 'Fazaa', 'Farhan']}
                />

                <Message
                  sender="You"
                  avatar="/placeholder.svg?height=40&width=40"
                  time="09:19 AM"
                  content={<p>Gokill Bangetttt!</p>}
                  isSelf={true}
                />

                <Message
                  sender="Farhan"
                  avatar="/placeholder.svg?height=40&width=40"
                  time="05:01 PM"
                  content={
                    <>
                      <div className="w-64 h-48 bg-gray-800 rounded-lg flex items-center justify-center mb-2">
                        <div className="text-center text-white">
                          <div className="text-xs mb-2">VIG</div>
                          <div className="font-bold">Visual Identity</div>
                          <div className="font-bold">Guidelines</div>
                        </div>
                      </div>
                      <p>Ada yang typo nih</p>
                    </>
                  }
                />

                <Message
                  sender="Momon"
                  avatar="/placeholder.svg?height=40&width=40"
                  time="05:11 PM"
                  content={<p>Gas ULLLL!</p>}
                />

                <Message
                  sender="Nolaaa"
                  avatar="/placeholder.svg?height=40&width=40"
                  time="09:25 AM"
                  content={
                    <>
                      <p>Like dlu guysss hehe</p>
                    </>
                  }
                />
              </div> */}
            </ScrollArea>
          </div>
          <MessageInput />
        </>
      )}
    </>
  );
};

export default ChatSection;

{
  /*  */
}

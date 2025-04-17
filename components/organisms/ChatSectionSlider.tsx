import { ScrollArea } from '@/components/atoms/scroll-area';
import ChatHeader from '@/components/molecules/ChatHeader';
import Message from '@/components/molecules/Message';
import MessageInput from '@/components/molecules/MessageInput';
import { SelectedUser } from '@/types/SelectUserTypes';
import { motion } from 'framer-motion';
import { LoaderCircle } from 'lucide-react';
import type { Dispatch, FC, SetStateAction } from 'react';

interface ChatSectionSliderProps {
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
  openSlider: boolean;
  handleMessageSent: () => void;
  handleOpenProfile: () => void;
  setChatInput: Dispatch<SetStateAction<string>>;
}

const ChatSectionSlider: FC<ChatSectionSliderProps> = ({
  isLoading,
  formattedMessages,
  chatInput,
  setChatInput,
  handleMessageSent,
  selectedRoom,
  handleOpenProfile,
  openSlider,
}) => {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: openSlider ? 0 : '100%' }}
      transition={{ type: 'spring', bounce: 0 }}
      className="absolute top-0 right-0 bottom-0 w-full bg-background shadow-xl z-10 border border-l-0 md:hidden"
    >
      {!selectedRoom ? (
        <div className="size-full flex items-center justify-center text-muted-foreground">
          Select chat to start
        </div>
      ) : (
        <div className="flex flex-col size-full">
          <ChatHeader
            avatar={selectedRoom?.user.image || ''}
            name={selectedRoom?.user.name || ''}
            handleOpenProfile={handleOpenProfile}
            status=""
          />
          <div className={`flex-1 `}>
            {isLoading ? (
              <div className="size-full flex items-center justify-center">
                <LoaderCircle className="animate-spin" />
              </div>
            ) : (
              <ScrollArea className="size-full" type="auto">
                <div className="absolute inset-0 p-2 px-3">
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
    </motion.div>
  );
};

export default ChatSectionSlider;

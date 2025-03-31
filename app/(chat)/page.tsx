'use client';

import ChatSidebar from '@/components/organisms/ChatSidebar';
import ChatTemplates from '@/components/templates/ChatTemplates';

import ChatSection from '@/components/organisms/ChatSection';
import { useChatList } from '@/hooks/useChatList';
import { usePrivateChat } from '@/hooks/usePrivateChat';
import { authClient } from '@/lib/auth-client';
import { useState } from 'react';
import { ChatListType } from '@/types/ChatListTypes';

export default function Home() {
  const [selectedChat, setSelectedChat] = useState<ChatListType>();
  const [msg, setMsg] = useState('');

  const { useSession } = authClient;

  const { data } = useSession();

  const { chatList, loading } = useChatList(data?.user.id || '');
  const {
    messages,
    receiver,
    loading: chatLoading,
    sendMessage,
  } = usePrivateChat(selectedChat?.id || '', data?.user.id || '');

  const onChatSelect = (data: ChatListType) => {
    setSelectedChat(data);
  };

  const handleSendMessage = () => {
    if (msg.trim()) {
      sendMessage(msg.trim());
      setMsg('');
    }
  };

  return (
    <ChatTemplates
      sidebar={
        <ChatSidebar
          onChatSelect={onChatSelect}
          chats={chatList}
          isLoading={loading}
        />
      }
      chatSection={
        <ChatSection
          user={selectedChat}
          messages={messages}
          isLoading={chatLoading}
          userId={data?.user.id || ''}
          handleMessageSent={handleSendMessage}
          msg={msg}
          setMsg={setMsg}
          receiver={receiver}
        />
      }
    />
  );
}

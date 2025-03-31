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
  const { useSession } = authClient;

  const { data } = useSession();

  const { chatList, loading } = useChatList(data?.user.id || '');
  const { messages, loading: chatLoading } = usePrivateChat(
    selectedChat?.id || '',
    data?.user.id || ''
  );

  const onChatSelect = (data: ChatListType) => {
    setSelectedChat(data);
  };

  console.log(messages);

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
        />
      }
    />
  );
}

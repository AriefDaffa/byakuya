'use client';

import MessageInput from '@/components/molecules/MessageInput';
import ChatHeader from '@/components/organisms/ChatHeader';
import ChatSidebar from '@/components/organisms/ChatSidebar';
import MessageThread from '@/components/organisms/MessageThread';
import ChatTemplates from '@/components/templates/ChatTemplates';

import { authClient } from '@/lib/auth-client';
import { useChatList } from '@/hooks/useChatList';

export default function Home() {
  const { useSession } = authClient;

  const { data } = useSession();

  const { chats, loading } = useChatList(data?.user.id || '');

  return (
    <ChatTemplates
      sidebar={<ChatSidebar chats={chats} isLoading={loading} />}
      header={
        <ChatHeader
          name="Hatypo Studio"
          status="Mas Aditt Typing...."
          avatar="/placeholder.svg?height=40&width=40"
        />
      }
      messageThread={<MessageThread />}
      messageInput={<MessageInput />}
    />
  );
}

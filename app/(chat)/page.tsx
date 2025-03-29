'use client';

import MessageInput from '@/components/molecules/MessageInput';
import ChatHeader from '@/components/organisms/ChatHeader';
import ChatSidebar from '@/components/organisms/ChatSidebar';
import MessageThread from '@/components/organisms/MessageThread';
import ChatTemplates from '@/components/templates/ChatTemplates';

import dummyChat from '@/__MOCK__/chat_list.json';
import { authClient } from '@/lib/auth-client';

export default function Home() {
  const { useSession } = authClient;

  const { data } = useSession();
  console.log(data?.user);

  return (
    <ChatTemplates
      sidebar={<ChatSidebar chats={dummyChat.chats} isLoading={false} />}
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

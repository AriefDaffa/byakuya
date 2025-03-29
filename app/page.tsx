'use client';

import MessageInput from '@/components/molecules/MessageInput';
import ChatHeader from '@/components/organisms/ChatHeader';
import ChatSidebar from '@/components/organisms/ChatSidebar';
import MessageThread from '@/components/organisms/MessageThread';
import ChatTemplates from '@/components/templates/ChatTemplates';

export default function Home() {
  return (
    <ChatTemplates
      sidebar={<ChatSidebar />}
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

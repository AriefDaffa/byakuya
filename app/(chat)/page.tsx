'use client';

import ChatSection from '@/components/organisms/ChatSection';
import ChatSidebar from '@/components/organisms/ChatSidebar';
import ChatTemplates from '@/components/templates/ChatTemplates';
import { Fragment } from 'react';

import ChatHeader from '@/components/molecules/ChatHeader';
import SheetLayer from '@/components/molecules/SheetLayer';
import ReceiverSheet from '@/components/organisms/ReceiverSheet';
import { useChatStore } from '@/store/useChatStore';

export default function ChatPage() {
  const {
    selectedUser,
    openChatSlider,
    setOpenChatSlider,
    openProfile,
    setOpenProfile,
  } = useChatStore();

  return (
    <Fragment>
      <ChatTemplates sidebar={<ChatSidebar />} chatSection={<ChatSection />} />
      <SheetLayer
        open={openChatSlider}
        setOpen={setOpenChatSlider}
        headerComp={
          <ChatHeader
            avatar={selectedUser.image || ''}
            name={selectedUser.name || ''}
            handleOpenProfile={setOpenProfile}
            status=""
          />
        }
      >
        <ChatSection withHeader={false} />
      </SheetLayer>
      <ReceiverSheet open={openProfile} setOpen={setOpenProfile} />
    </Fragment>
  );
}

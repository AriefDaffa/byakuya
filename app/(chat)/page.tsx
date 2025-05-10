'use client';

import { useChat } from '@/hooks/pages/useChat';

import ChatSection from '@/components/organisms/ChatSection';
import ChatSidebar from '@/components/organisms/ChatSidebar';
import ChatTemplates from '@/components/templates/ChatTemplates';
import { Fragment } from 'react';

import ChatHeader from '@/components/molecules/ChatHeader';
import SheetLayer from '@/components/molecules/SheetLayer';
import ReceiverSheet from '@/components/organisms/ReceiverSheet';
import { useChatSlider } from '@/hooks/pages/Chat/useChatSlider';
import { useChatStore } from '@/store/useChatStore';

export default function ChatPage() {
  const { handleOpenChatMob, handleOpenProfile, openProfile, setOpenProfile } =
    useChat();

  const { openChatSlider, setOpenChatSlider } = useChatSlider();
  const { selectedRoom } = useChatStore();

  return (
    <Fragment>
      <ChatTemplates
        sidebar={
          <ChatSidebar
            handleOpenChatMob={handleOpenChatMob}
            setOpenChatSlider={setOpenChatSlider}
          />
        }
        chatSection={
          <ChatSection
            openProfile={openProfile}
            handleOpenProfile={handleOpenProfile}
          />
        }
      />
      <SheetLayer
        open={openChatSlider}
        setOpen={setOpenChatSlider}
        headerComp={
          <ChatHeader
            avatar={selectedRoom?.user.image || ''}
            name={selectedRoom?.user.name || ''}
            handleOpenProfile={handleOpenProfile}
            status=""
          />
        }
      >
        <ChatSection
          withHeader={false}
          openProfile={openProfile}
          handleOpenProfile={handleOpenProfile}
        />
      </SheetLayer>
      <ReceiverSheet open={openProfile} setOpen={setOpenProfile} />
    </Fragment>
  );
}

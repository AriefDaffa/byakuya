'use client';

import { useChat } from '@/hooks/pages/useChat';

import ChatTemplates from '@/components/templates/ChatTemplates';
import SideMenu from '@/components/organisms/SideMenu';
import ChatSidebar from '@/components/organisms/ChatSidebar';
import ChatSection from '@/components/organisms/ChatSection';
import SearchUserDialog from '@/components/molecules/SearchUserDialog';

import { useCallback, useState } from 'react';
import SliderBar from '@/components/organisms/SliderBar';
import ReceiverProfile from '@/components/molecules/ReceiverProfile';

export default function ChatPage() {
  const {
    session,
    chatList,
    isChatListLoading,
    selectedRoom,
    setOpenDialog,
    openDialog,
    handleSelectChat,
    handleKeywordChange,
    usersList,
    userSearchLoading,
    handleCreatePrivateChat,
    isCreatePCLoading,
    formattedMessages,
    isMessageListLoading,
    chatInput,
    setChatInput,
    handleSubmitMessage,
  } = useChat();

  const [openProfile, setOpenProfile] = useState(false);

  const handleOpenProfile = useCallback(() => {
    setOpenProfile(!openProfile);
  }, [openProfile]);

  return (
    <>
      <ChatTemplates
        sideMenu={
          <SideMenu
            avatar={session?.user.image || ''}
            userName={session?.user.name || ''}
          />
        }
        sidebar={
          <ChatSidebar
            isLoading={isChatListLoading}
            chatList={chatList}
            onChatSelect={handleSelectChat}
            // logged user
            userName={session?.user.name}
            avatar={session?.user.image || ''}
            // selected chat
            selectedChatId={selectedRoom?.user.id}
            // dialog handle
            setOpenDialog={setOpenDialog}
          />
        }
        chatSection={
          <ChatSection
            selectedRoom={selectedRoom}
            isLoading={isMessageListLoading}
            formattedMessages={formattedMessages}
            //send msg
            chatInput={chatInput}
            setChatInput={setChatInput}
            handleMessageSent={handleSubmitMessage}
            // receiver profile
            handleOpenProfile={handleOpenProfile}
            // slidebar
            openProfile={openProfile}
          />
        }
        rightSidebar={
          <SliderBar open={openProfile} handleClose={handleOpenProfile}>
            <ReceiverProfile
              avatar={selectedRoom?.user.image}
              name={selectedRoom?.user.name}
            />
          </SliderBar>
        }
      />
      <SearchUserDialog
        openDialog={openDialog}
        setOpenDialog={setOpenDialog}
        handleKeywordChange={handleKeywordChange}
        //sender id
        senderId={session?.user.id}
        // search user result
        usersList={usersList?.data}
        isSearching={userSearchLoading}
        // create PC
        isCreatePCLoading={isCreatePCLoading}
        handleOnUserClick={handleCreatePrivateChat}
      />
    </>
  );
}

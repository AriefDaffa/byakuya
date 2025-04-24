'use client';

import { useChat } from '@/hooks/pages/useChat';

import SearchUserDialog from '@/components/molecules/SearchUserDialog';
import ChatSection from '@/components/organisms/ChatSection';
import ChatSidebar from '@/components/organisms/ChatSidebar';
import ChatTemplates from '@/components/templates/ChatTemplates';

import ChatSectionSlider from '@/components/organisms/ChatSectionSlider';
import ReceiverSheet from '@/components/organisms/ReceiverSheet';

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
    handleOpenChatMob,
    handleOpenProfile,
    openChatMob,
    openProfile,
    hasMore,
    loadMore,
    loadingOlderMessages,
    setOpenProfile,
  } = useChat();

  return (
    <>
      <ChatTemplates
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
            // open mobile menu
            handleOpenChatMob={handleOpenChatMob}
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
            // load more msg
            hasNextPage={hasMore}
            loadMore={loadMore}
            loadingOlderMessages={loadingOlderMessages}
          />
        }
        mobileComp={
          <ChatSectionSlider
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
            openSlider={
              openChatMob && typeof selectedRoom?.user.name === 'string'
            }
          />
        }
      />
      <ReceiverSheet
        open={openProfile}
        setOpen={setOpenProfile}
        avatar={selectedRoom?.user.image}
        name={selectedRoom?.user.name}
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

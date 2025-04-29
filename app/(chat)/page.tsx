'use client';

import { useChat } from '@/hooks/pages/useChat';

import SearchUserDialog from '@/components/molecules/SearchUserDialog';
import ChatSection from '@/components/organisms/ChatSection';
import ChatSidebar from '@/components/organisms/ChatSidebar';
import ChatTemplates from '@/components/templates/ChatTemplates';
import { Fragment } from 'react';

import SheetLayer from '@/components/molecules/SheetLayer';
import ReceiverSheet from '@/components/organisms/ReceiverSheet';
import { useChatSlider } from '@/hooks/pages/Chat/useChatSlider';
import { useSidebarSearch } from '@/hooks/pages/Chat/useSidebarSearch';
import ChatHeader from '@/components/molecules/ChatHeader';

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
    openProfile,
    hasMore,
    loadMore,
    loadingOlderMessages,
    setOpenProfile,
  } = useChat();

  const { data, loading, setSidebarKeyword, sidebarKeyword } =
    useSidebarSearch();
  const { openChatSlider, setOpenChatSlider } = useChatSlider();

  return (
    <Fragment>
      <ChatTemplates
        sidebar={
          <ChatSidebar
            //
            // Chat loader
            //
            isLoading={isChatListLoading}
            chatList={chatList}
            onChatSelect={handleSelectChat}
            //
            // logged user
            //
            userName={session?.user.name}
            avatar={session?.user.image || ''}
            //
            // selected chat
            //
            selectedChatId={selectedRoom?.user.id}
            //
            // dialog handle
            //
            setOpenDialog={setOpenDialog}
            //
            // open mobile menu
            //
            handleOpenChatMob={handleOpenChatMob}
            //
            // sidebar search function
            //
            sidebarkeyword={sidebarKeyword}
            setSidebarKeyword={setSidebarKeyword}
            isSearching={loading}
            searchResult={data}
            //
            // Chat slider handler (mobile only)
            //
            setOpenChatSlider={setOpenChatSlider}
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
          withHeader={false}
        />
      </SheetLayer>
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
        usersList={usersList}
        isSearching={userSearchLoading}
        // create PC
        isCreatePCLoading={isCreatePCLoading}
        handleOnUserClick={handleCreatePrivateChat}
      />
    </Fragment>
  );
}

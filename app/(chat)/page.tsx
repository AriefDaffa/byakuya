'use client';

import { useChat } from '@/hooks/pages/useChat';

import SearchUserDialog from '@/components/molecules/SearchUserDialog';
import ChatSection from '@/components/organisms/ChatSection';
import ChatSidebar from '@/components/organisms/ChatSidebar';
import ChatTemplates from '@/components/templates/ChatTemplates';
import { Fragment } from 'react';

import ChatHeader from '@/components/molecules/ChatHeader';
import SheetLayer from '@/components/molecules/SheetLayer';
import ReceiverSheet from '@/components/organisms/ReceiverSheet';
import { useChatRoom } from '@/hooks/pages/Chat/useChatRoom';
import { useChatSlider } from '@/hooks/pages/Chat/useChatSlider';
import { useSidebarSearch } from '@/hooks/pages/Chat/useSidebarSearch';
import { useChatList } from '@/hooks/pages/Chat/useChatList';

export default function ChatPage() {
  const {
    session,
    setOpenDialog,
    openDialog,
    handleKeywordChange,
    usersList,
    userSearchLoading,
    handleCreatePrivateChat,
    isCreatePCLoading,
    handleOpenChatMob,
    handleOpenProfile,
    openProfile,
    setOpenProfile,
  } = useChat();

  const { data, loading, setSidebarKeyword, sidebarKeyword } =
    useSidebarSearch();
  const { openChatSlider, setOpenChatSlider } = useChatSlider();
  const { chatList, loading: isChatListLoading } = useChatList();
  const { selectedRoom, hasMore, loadMore, loadingOlderMessages } =
    useChatRoom();

  return (
    <Fragment>
      <ChatTemplates
        sidebar={
          <ChatSidebar
            isLoading={isChatListLoading}
            chatList={chatList}
            userName={session?.user.name}
            avatar={session?.user.image || ''}
            selectedChatId={selectedRoom?.user.id}
            setOpenDialog={setOpenDialog}
            handleOpenChatMob={handleOpenChatMob}
            sidebarkeyword={sidebarKeyword}
            setSidebarKeyword={setSidebarKeyword}
            isSearching={loading}
            searchResult={data}
            setOpenChatSlider={setOpenChatSlider}
          />
        }
        chatSection={
          <ChatSection
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
      <ReceiverSheet open={openProfile} setOpen={setOpenProfile} />
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

'use client';

import { useFetchChatList } from '@/hooks/fetch/useFetchChatList';
import { authClient } from '@/lib/auth-client';
import { ChatListType, User } from '@/types/ChatListTypes';
import { SelectedUser } from '@/types/SelectUserTypes';
import { useDebouncedValue } from '@mantine/hooks';

import { useFetchMessages } from '@/hooks/fetch/useFetchMessages';

import SearchUserDialog from '@/components/molecules/SearchUserDialog';
import ChatSection from '@/components/organisms/ChatSection';
import ChatSidebar from '@/components/organisms/ChatSidebar';
import ChatTemplates from '@/components/templates/ChatTemplates';
import {
  CreateChatPayload,
  useCreatePrivateChat,
} from '@/hooks/fetch/useCreatePrivateChat';
import { useSearchUsers } from '@/hooks/useSearchUser';
import { useCallback, useMemo, useState } from 'react';

export default function ChatPage() {
  const { useSession } = authClient;
  const { data: session } = useSession();

  const [selectedRoom, setSelectedRoom] = useState<SelectedUser>();
  const [messageKeyword, setMessageKeyword] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [openDialog, setOpenDialog] = useState(false);

  const [debounced] = useDebouncedValue(messageKeyword, 200);

  const {
    chatList,
    loading: isChatListLoading,
    prependOrUpdateChat,
  } = useFetchChatList(session?.user.id || '');

  const {
    messages: messagesList,
    receiver,
    loading: isMessageListLoading,
    sendMessage,
  } = useFetchMessages(selectedRoom?.roomId || '', session?.user.id || '');
  const { data: usersList, loading: userSearchLoading } =
    useSearchUsers(debounced);
  const { createChat, loading: isCreatePCLoading } = useCreatePrivateChat();

  const handleSelectChat = (data: ChatListType) => {
    setSelectedRoom({
      roomId: data.id,
      user: {
        id: data.user.id,
        image: data.user.image || '',
        name: data.user.name,
      },
    });
  };

  const formattedMessages = useMemo(() => {
    const findReceiver = receiver.find(
      (el) => el.user.id !== session?.user.id
    )?.user;

    return messagesList
      .map((item) => ({
        id: item.id,
        sender:
          item.senderId === session?.user.id ? 'You' : findReceiver?.name || '',
        avatar:
          item.senderId === session?.user.id
            ? session.user.image || ''
            : findReceiver?.image || '',
        time: item.createdAt,
        content: item.content,
        isSelf: item.senderId === session?.user.id,
      }))
      .reverse();
  }, [messagesList, receiver, session?.user.id, session?.user.image]);

  const handleKeywordChange = useCallback((e: string) => {
    setMessageKeyword(e);
  }, []);

  const handleSubmitMessage = useCallback(() => {
    const messageContent = chatInput;
    sendMessage(messageContent);
    setChatInput('');

    if (selectedRoom && session?.user.id) {
      prependOrUpdateChat({
        id: selectedRoom.roomId,
        type: 'private', // assuming it's always private in this case
        user: selectedRoom.user,
        unreadCount: 0, // you're the sender
        latestMessage: {
          id: 'temp-id-' + Date.now(), // temporary ID for optimistic message
          senderId: session.user.id,
          content: messageContent,
          createdAt: new Date().toISOString(),
          privateChatId: selectedRoom.roomId,
          groupChatId: null,
          userId: session.user.id,
        },
      });
    }
  }, [
    chatInput,
    sendMessage,
    selectedRoom,
    prependOrUpdateChat,
    session?.user.id,
  ]);

  const handleCreatePrivateChat = useCallback(
    async (payload: CreateChatPayload, receiverData: User) => {
      try {
        const req = await createChat(payload);

        setSelectedRoom({
          roomId: req.data.id,
          user: {
            id: receiverData.id,
            image: receiverData.image || '',
            name: receiverData.name,
          },
        });

        setOpenDialog(false);
      } catch (err) {
        console.error('Failed to create chat', err);
      }
    },
    [createChat]
  );

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
          />
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

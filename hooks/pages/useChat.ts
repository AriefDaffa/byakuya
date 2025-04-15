import { useState, useCallback, useMemo } from 'react';
import { useDebouncedValue } from '@mantine/hooks';

import { useFetchChatList } from '@/hooks/fetch/useFetchChatList';
import { useFetchMessages } from '@/hooks/fetch/useFetchMessages';
import {
  useCreatePrivateChat,
  CreateChatPayload,
} from '@/hooks/fetch/useCreatePrivateChat';
import { useSearchUsers } from '@/hooks/fetch/useSearchUser';
import { authClient } from '@/lib/auth-client';

import { SelectedUser } from '@/types/SelectUserTypes';
import { ChatListType, User } from '@/types/ChatListTypes';

export const useChat = () => {
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
        type: 'private',
        user: selectedRoom.user,
        unreadCount: 0,
        latestMessage: {
          id: 'temp-id-' + Date.now(),
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

  return {
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
  };
};

import { authClient } from '@/lib/auth-client';
import { useChatListStore } from '@/store/useChatListStore';
import { useMessageStore } from '@/store/useMessageStore';
import { ChatListType } from '@/types/ChatListTypes';
import { SelectedUser } from '@/types/SelectUserTypes';
import { useCallback, useMemo, useState } from 'react';

export const useChatRoom = () => {
  const { useSession } = authClient;
  const { data: session } = useSession();

  const { prependOrUpdateChat } = useChatListStore();
  const {
    messages,
    receiver,
    loading,
    sendMessage,
    loadMore,
    hasMore,
    loadingOlderMessages,
  } = useMessageStore();

  const [selectedRoom, setSelectedRoom] = useState<SelectedUser>();
  const [chatInput, setChatInput] = useState('');

  const formattedMessages = useMemo(() => {
    const findReceiver = receiver.find(
      (el) => el.user.id !== session?.user.id
    )?.user;

    return messages
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
  }, [messages, receiver, session?.user.id, session?.user.image]);

  const handleSelectPC = useCallback((data: ChatListType) => {
    setSelectedRoom({
      roomId: data.id,
      user: {
        id: data.user.id,
        image: data.user.image || '',
        name: data.user.name,
        email: data.user.email,
      },
    });
  }, []);

  const handleSubmitMessage = useCallback(() => {
    sendMessage(chatInput, session?.user.id || '');
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
          content: chatInput,
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

  return useMemo(() => {
    return {
      chatInput,
      setChatInput,
      selectedRoom,
      handleSelectPC,
      formattedMessages,
      loading,
      sendMessage,
      loadMore,
      hasMore,
      loadingOlderMessages,
      handleSubmitMessage,
    };
  }, [
    chatInput,
    setChatInput,
    formattedMessages,
    handleSelectPC,
    selectedRoom,
    loading,
    sendMessage,
    loadMore,
    hasMore,
    loadingOlderMessages,
    handleSubmitMessage,
  ]);
};

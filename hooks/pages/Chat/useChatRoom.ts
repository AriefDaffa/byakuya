import { authClient } from '@/lib/auth-client';
import { getMessages } from '@/services/getMessages';
import { useChatListStore } from '@/store/useChatListStore';
import { useChatStore } from '@/store/useChatStore';
import {
  ChatMessageTypesResponse,
  MessageTypes,
} from '@/types/ChatMessageTypes';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';

export const useChatRoom = () => {
  const { useSession } = authClient;
  const { data: session } = useSession();

  const { selectedRoom, messageKeyword, setMessageKeyword } = useChatStore();
  const { prependOrUpdateChat } = useChatListStore();

  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<ChatMessageTypesResponse>({
    queryKey: [`message-${selectedRoom.roomId}`],
    queryFn: () => getMessages(selectedRoom.roomId, 1),
    enabled: selectedRoom.roomId !== '',
    initialData: {
      data: {
        messages: [],
        receiver: [],
        pagination: {
          currentPage: 0,
          totalMessages: 0,
          totalPages: 0,
        },
      },
      message: '',
      success: false,
    },
  });

  useEffect(() => {
    if (selectedRoom.roomId === '') {
      return;
    }

    const socket = new WebSocket(
      `${process.env.NEXT_PUBLIC_BASE_WEBSOCKET_URL}/v1/personal-chat?receiver=${selectedRoom.user.id}`
    );

    socket.onopen = () => {
      console.log(`Connected to room ${selectedRoom.user.name}`);
      // reconnectAttempts = 0;
    };

    socket.onmessage = (event) => {
      try {
        // const newMessage: MessageTypes = JSON.parse(event.data);
        // setMessages((prev) => [newMessage, ...prev]);
      } catch (err) {
        console.log('Failed to parse message:', err);
      }
    };

    socket.onerror = (error) => {
      console.log('WebSocket Error:', error);
    };

    socket.onclose = (event) => {
      console.log('WebSocket Disconnected', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });

      // if (event.code !== 1000) {
      //   const timeout = Math.min(10000, 1000 * 2 ** reconnectAttempts);
      //   reconnectTimeout = setTimeout(() => {
      //     reconnectAttempts++;
      //     connectWebSocket();
      //   }, timeout);
      // }
    };

    return () => {
      socket.close();
    };
  }, [selectedRoom]);

  // const handleSubmitMessage = useCallback(() => {
  //   sendMessage(messageKeyword);
  //   setMessageKeyword('');

  //   if (selectedRoom && session?.user.id) {
  //     prependOrUpdateChat({
  //       id: selectedRoom.roomId,
  //       type: 'private',
  //       user: selectedRoom.user,
  //       unreadCount: 0,
  //       latestMessage: {
  //         id: 'temp-id-' + Date.now(),
  //         senderId: session.user.id,
  //         content: messageKeyword,
  //         createdAt: new Date().toISOString(),
  //         privateChatId: selectedRoom.roomId,
  //         groupChatId: null,
  //         userId: session.user.id,
  //       },
  //     });
  //   }
  // }, []);

  const formattedMessages = useMemo(() => {
    const findReceiver = data.data.receiver.find(
      (el) => el.user.id !== session?.user.id
    )?.user;

    return data.data.messages
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
  }, [data, session]);

  return useMemo(() => {
    return {
      data,
      isLoading,
      isError,
      formattedMessages,
    };
  }, [data, formattedMessages, isError, isLoading]);
};

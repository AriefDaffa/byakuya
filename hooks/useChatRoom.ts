'use client';
// import { generateId } from '@/hooks/fetch/useFetchMessages';
import { authClient } from '@/lib/auth-client';
import { getMessages } from '@/services/getMessages';
import { useChatListStore } from '@/store/useChatListStore';
// import { useChatListStore } from '@/store/useChatListStore';
import { useChatStore } from '@/store/useChatStore';
import { ChatListData } from '@/types/ChatListTypes';
import {
  FormattedMsg,
  MessagesItem,
  PrivateChatResponse,
} from '@/types/PrivateChatResponse';
import { generateId } from '@/utils/generateId';
import { isJSONParseable } from '@/utils/isJSONParseable';

import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const initialData = {
  data: {
    currentPage: 0,
    totalMessages: 0,
    totalPages: 0,
    messages: [],
  },
  message: '',
  success: false,
};

export const useChatRoom = () => {
  const { useSession } = authClient;
  const { data: session } = useSession();

  const socketRef = useRef<WebSocket | null>(null);

  const { selectedRoom, messageKeyword, setMessageKeyword } = useChatStore();
  const { mutatedData: chatListData, setMutatedData: setChatListData } =
    useChatListStore();

  const [mutatedData, setMutatedData] = useState<MessagesItem[]>([]);
  console.log(selectedRoom);

  const { data, isLoading, isError, isSuccess } = useQuery<PrivateChatResponse>(
    {
      queryKey: [`message-${selectedRoom.user.id}`],
      queryFn: () => getMessages(selectedRoom.user.id, 1),
      enabled: selectedRoom.user.id !== '',
      initialData,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    }
  );

  const formatMessage = useCallback(
    (messages: MessagesItem[]): FormattedMsg[] => {
      if (messages.length === 0) return [];

      const sorted = [...messages].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      const groups: FormattedMsg[] = [];

      for (const message of sorted) {
        const lastGroup = groups[groups.length - 1];
        const messageTime = new Date(message.createdAt).getTime();

        if (lastGroup && lastGroup.id === message.sender.id) {
          const lastMessageInGroup =
            lastGroup.messages[lastGroup.messages.length - 1];
          const lastMessageTime = new Date(
            lastMessageInGroup.createdAt
          ).getTime();

          const diffInMs = messageTime - lastMessageTime;

          if (diffInMs <= 60_000) {
            lastGroup.messages.push(message);
            continue;
          }
        }

        groups.push({
          id: message.sender.id,
          name: message.sender.name,
          image: message.sender.image,
          email: message.sender.email,
          messages: [message],
        });
      }

      return groups;
    },
    []
  );

  const sendMessage = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const newMessage: MessagesItem = {
        id: generateId(),
        privateChatId: generateId(),
        content: messageKeyword,
        createdAt: new Date().toISOString(),
        sender: {
          id: session?.user.id || '',
          email: session?.user.email || '',
          image: session?.user.image || '',
          name: session?.user.name || '',
        },
        receiver: {
          id: selectedRoom.user.id || '',
          email: selectedRoom.user.email || '',
          image: selectedRoom.user.image || '',
          name: selectedRoom.user.name || '',
        },
      };

      const newListData: ChatListData[] = [
        {
          id: selectedRoom.user.id || '',
          email: selectedRoom.user.email || '',
          image: selectedRoom.user.image || '',
          name: selectedRoom.user.name || '',
          latestMessage: {
            id: generateId(),
            content: messageKeyword,
            createdAt: new Date().toISOString(),
          },
        },
      ];

      const existingChat = chatListData.some(
        (el) => el.id === selectedRoom.user.id
      );

      setMutatedData((prev) => [newMessage, ...prev]);
      setChatListData(
        existingChat
          ? chatListData.map((el) =>
              el.id === selectedRoom.user.id
                ? {
                    ...el,
                    latestMessage: {
                      id: generateId(),
                      content: messageKeyword,
                      createdAt: new Date().toISOString(),
                    },
                  }
                : el
            )
          : [...newListData, ...chatListData]
      );
      setMessageKeyword('');

      socketRef.current.send(JSON.stringify({ message: messageKeyword }));
    } else {
      console.warn('WebSocket is not connected.');
    }
  }, [
    chatListData,
    messageKeyword,
    selectedRoom,
    session,
    setChatListData,
    setMessageKeyword,
  ]);

  useEffect(() => {
    if (isSuccess) {
      setMutatedData(data.data.messages);
    }
  }, [data.data.messages, isSuccess]);

  useEffect(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }

    if (selectedRoom.user.id === '') {
      return;
    }

    const socket = new WebSocket(
      `${process.env.NEXT_PUBLIC_BASE_WEBSOCKET_URL}/v1/personal-chat?receiver=${selectedRoom.user.id}`
    );

    socketRef.current = socket;

    socket.onopen = () => {
      console.log(`Connected to room ${selectedRoom.user.name}`);
      // reconnectAttempts = 0;
    };

    socket.onmessage = (event) => {
      try {
        if (isJSONParseable(event.data)) {
          const newMessage: MessagesItem = JSON.parse(event.data);
          console.log(newMessage);

          if (newMessage.sender.id !== session?.user.id) {
            setMutatedData((prev) => [...prev, newMessage]);
          }
        }
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
  }, [selectedRoom, session?.user.id]);

  return useMemo(() => {
    return {
      data,
      messages: mutatedData,
      isLoading,
      isError,
      formatMessage,
      sendMessage,
    };
  }, [data, formatMessage, isError, isLoading, mutatedData, sendMessage]);
};

'use client';

import { authClient } from '@/lib/auth-client';
import { getChatList } from '@/services/getChatList';
import { useChatListStore } from '@/store/useChatListStore';
import { ChatListData, ChatListResponse } from '@/types/ChatListTypes';
import { generateId } from '@/utils/generateId';
import { isJSONParseable } from '@/utils/isJSONParseable';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';

const initialData = {
  data: [],
  message: '',
  success: false,
};

export const useChatList = () => {
  const { useSession } = authClient;
  const { data: session } = useSession();

  const socketRef = useRef<WebSocket | null>(null);

  const { mutatedData, setMutatedData } = useChatListStore();

  const { data, isLoading, isError, isSuccess } = useQuery<ChatListResponse>({
    queryKey: [`chat-list-${session?.user.id}`],
    queryFn: getChatList,
    initialData,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (isSuccess) {
      setMutatedData(data.data);
    }
  }, [data.data, isSuccess, setMutatedData]);

  useEffect(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }

    const socket = new WebSocket(
      `${process.env.NEXT_PUBLIC_BASE_WEBSOCKET_URL}/v1/chat-list`
    );

    socketRef.current = socket;

    socket.onopen = () => {};

    socket.onmessage = (event) => {
      try {
        if (isJSONParseable(event.data)) {
          const newMessage: ChatListData = JSON.parse(event.data);
          console.log(newMessage);

          if (newMessage.id !== session?.user.id) {
            const existingChat = mutatedData.some(
              (el) => el.id === newMessage.id
            );

            setMutatedData(
              existingChat
                ? mutatedData.map((el) =>
                    el.id === newMessage.id
                      ? {
                          ...el,
                          latestMessage: {
                            id: generateId(),
                            content: newMessage.latestMessage.content,
                            createdAt: new Date().toISOString(),
                          },
                        }
                      : el
                  )
                : [newMessage, ...mutatedData]
            );
          }
        }
      } catch (err) {
        console.log('Failed to parse message:', err);
      }
    };

    socket.onerror = (error) => {
      console.log('Socket chat list Error:', error);
    };

    socket.onclose = (event) => {
      console.log('WebSocket Disconnected', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });
    };

    return () => {
      socket.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useMemo(() => {
    return { data: mutatedData, isLoading, isError, isSuccess };
  }, [isError, isLoading, isSuccess, mutatedData]);
};

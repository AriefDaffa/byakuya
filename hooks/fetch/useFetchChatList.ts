import { ChatListType, ChatListTypeResponse } from '@/types/ChatListTypes';
import { useEffect, useState, useRef } from 'react';

export function useFetchChatList(userId: string) {
  const [chatList, setChatList] = useState<ChatListType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  function sortChatList(chats: ChatListType[]) {
    return [...chats].sort((a, b) => {
      return (
        new Date(b.latestMessage.createdAt).getTime() -
        new Date(a.latestMessage.createdAt).getTime()
      );
    });
  }

  useEffect(() => {
    if (!userId) return;

    async function fetchChats() {
      try {
        setLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API_URL}/v1/chat-list?user_id=${userId}`
        );
        if (!res.ok) throw new Error('Failed to load chat list');
        const data: ChatListTypeResponse = await res.json();
        setChatList(sortChatList(data.data));
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    function setupWebSocket() {
      if (wsRef.current) {
        wsRef.current.close();
      }

      const ws = new WebSocket(
        `${process.env.NEXT_PUBLIC_BASE_WEBSOCKET_URL}/v1/chat-list?user_id=${userId}`
      );

      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🔗 Chat List WebSocket Connected');
        reconnectAttemptsRef.current = 0; // reset on success
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.updated && data.chat) {
          setChatList((prevChats) => {
            const chatExists = prevChats.some(
              (chat) => chat.id === data.chat.id
            );

            let updatedChats: ChatListType[];

            if (chatExists) {
              updatedChats = prevChats.map((chat) =>
                chat.id === data.chat.id
                  ? {
                      ...chat,
                      latestMessage: data.chat.latestMessage,
                      unreadCount: data.chat.unreadCount,
                    }
                  : chat
              );
            } else {
              updatedChats = [data.chat, ...prevChats];
            }

            return sortChatList(updatedChats);
          });
        }
      };

      ws.onerror = (event) => {
        console.error('❌ Chat List WebSocket Error:', event);
      };

      ws.onclose = () => {
        console.warn('❌ Chat List WebSocket Disconnected');
        const timeout = Math.min(
          10000,
          1000 * 2 ** reconnectAttemptsRef.current
        );
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          setupWebSocket(); // try reconnect
        }, timeout);
      };
    }

    fetchChats();
    setupWebSocket();

    return () => {
      wsRef.current?.close();
      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);
    };
  }, [userId]);

  const prependOrUpdateChat = (newChat: ChatListType) => {
    setChatList((prev) => {
      const exists = prev.some((chat) => chat.id === newChat.id);

      let updated: ChatListType[];
      if (exists) {
        updated = prev.map((chat) =>
          chat.id === newChat.id
            ? { ...chat, latestMessage: newChat.latestMessage }
            : chat
        );
      } else {
        updated = [newChat, ...prev];
      }

      return sortChatList(updated);
    });
  };

  return { chatList, loading, error, prependOrUpdateChat };
}

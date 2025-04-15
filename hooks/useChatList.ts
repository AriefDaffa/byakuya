import { ChatListType, ChatListTypeResponse } from '@/types/ChatListTypes';
import { useEffect, useState } from 'react';

export function useChatList(userId: string) {
  const [chatList, setChatList] = useState<ChatListType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    let socket: WebSocket | null = null;

    async function fetchChats() {
      try {
        setLoading(true);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API_URL}/v1/chat-list?user_id=${userId}`
        );
        if (!res.ok) throw new Error('Failed to load chat list');
        const data: ChatListTypeResponse = await res.json();

        setChatList(data.data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    function setupWebSocket() {
      socket = new WebSocket(
        `${process.env.NEXT_PUBLIC_BASE_WEBSOCKET_URL}/v1/chat-list?user_id=${userId}`
      );

      socket.onmessage = async (event) => {
        const data = JSON.parse(event.data);

        if (data.updated && data.chat) {
          setChatList((prevChats) => {
            const chatExists = prevChats.some(
              (chat) => chat.id === data.chat.id
            );
            if (chatExists) {
              return prevChats.map((chat) =>
                chat.id === data.chat.id
                  ? {
                      ...chat,
                      latestMessage: data.chat.latestMessage,
                      unreadCount: data.chat.unreadCount,
                    }
                  : chat
              );
            } else {
              return [data.chat, ...prevChats];
            }
          });
        }
      };

      socket.onerror = (event) => {
        console.error('WebSocket error:', event);
      };

      return () => {
        socket?.close();
      };
    }

    fetchChats();
    const cleanupWebSocket = setupWebSocket();

    return () => cleanupWebSocket();
  }, [userId]);

  return { chatList, loading, error };
}

import { ChatListType, ChatListTypeResponse } from '@/types/ChatListTypes';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useFetchChatList(userId: string) {
  const [chatList, setChatList] = useState<ChatListType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasFetchedRef = useRef(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const sortChatList = useCallback((chats: ChatListType[]) => {
    return [...chats].sort(
      (a, b) =>
        new Date(b.latestMessage.createdAt).getTime() -
        new Date(a.latestMessage.createdAt).getTime()
    );
  }, []);

  const prependOrUpdateChat = useCallback(
    (newChat: ChatListType) => {
      setChatList((prev) => {
        const exists = prev.some((chat) => chat.id === newChat.id);
        const updated = exists
          ? prev.map((chat) =>
              chat.id === newChat.id
                ? { ...chat, latestMessage: newChat.latestMessage }
                : chat
            )
          : [newChat, ...prev];
        return sortChatList(updated);
      });
    },
    [sortChatList]
  );

  const fetchChats = useCallback(async () => {
    if (!userId || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API_URL}/v1/chat-list?user_id=${userId}`,
        { credentials: 'include' }
      );
      if (!res.ok) throw new Error('Failed to load chat list');
      const data: ChatListTypeResponse = await res.json();
      setChatList(sortChatList(data.data));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId, sortChatList]);

  // Setup WebSocket connection
  const setupWebSocket = useCallback(() => {
    if (!userId) return;
    if (wsRef.current) wsRef.current.close();

    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_BASE_WEBSOCKET_URL}/v1/chat-list?user_id=${userId}`
    );

    wsRef.current = ws;

    ws.onopen = () => {
      console.log('🔗 WebSocket connected');
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.updated && data.chat) {
        setChatList((prevChats) => {
          const chatExists = prevChats.some((chat) => chat.id === data.chat.id);
          const updatedChats = chatExists
            ? prevChats.map((chat) =>
                chat.id === data.chat.id
                  ? {
                      ...chat,
                      latestMessage: data.chat.latestMessage,
                      unreadCount: data.chat.unreadCount,
                    }
                  : chat
              )
            : [data.chat, ...prevChats];

          return sortChatList(updatedChats);
        });
      }
    };

    ws.onerror = (event) => {
      console.error('❌ WebSocket error:', event);
    };

    ws.onclose = () => {
      console.warn('❌ WebSocket disconnected');
      const timeout = Math.min(10000, 1000 * 2 ** reconnectAttemptsRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectAttemptsRef.current++;
        setupWebSocket();
      }, timeout);
    };
  }, [userId, sortChatList]);

  // Initial fetch and socket setup
  useEffect(() => {
    if (!userId) return;
    fetchChats();
    setupWebSocket();

    return () => {
      wsRef.current?.close();
      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchChats, setupWebSocket]);

  return { chatList, loading, error, prependOrUpdateChat };
}

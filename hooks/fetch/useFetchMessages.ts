import { MessageTypes, Receiver } from '@/types/ChatMessageTypes';
import { useState, useEffect, useCallback, useRef } from 'react';

const API_URL = `${process.env.NEXT_PUBLIC_BASE_API_URL}/v1/private-chat`;
const WS_URL = `${process.env.NEXT_PUBLIC_BASE_WEBSOCKET_URL}/v1/personal-chat`;

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalMessages: number;
}

export function useFetchMessages(roomId: string, user_id: string) {
  const [messages, setMessages] = useState<MessageTypes[]>([]);
  const [receiver, setReceiver] = useState<Receiver[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const wsRef = useRef<WebSocket | null>(null);

  const fetchMessages = useCallback(
    async (pageNum: number = 1) => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}?room_id=${roomId}&page=${pageNum}`);
        if (!res.ok) throw new Error('Failed to fetch');

        const data = await res.json();

        if (pageNum === 1) {
          setMessages(data.data.messages);
          setReceiver(data.data.receiver);
        } else {
          setMessages((prev) => [...prev, ...data.data.messages]);
        }

        setPagination(data.pagination);
        setHasMore(data.pagination.currentPage < data.pagination.totalPages);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setError('Failed to fetch messages');
      } finally {
        setLoading(false);
      }
    },
    [roomId]
  );

  useEffect(() => {
    if (!roomId || !user_id) return;

    let reconnectTimeout: NodeJS.Timeout;
    let reconnectAttempts = 0;

    const connectWebSocket = () => {
      // ✅ CLOSE previous WebSocket if open
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }

      const ws = new WebSocket(
        `${WS_URL}?user_id=${user_id}&room_id=${roomId}`
      );
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🔗 WebSocket Connected');
        reconnectAttempts = 0;
      };

      ws.onmessage = (event) => {
        try {
          const newMessage: MessageTypes = JSON.parse(event.data);
          setMessages((prev) => [newMessage, ...prev]);
        } catch (err) {
          console.error('❌ Failed to parse message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket Error:', error);
      };

      ws.onclose = (event) => {
        console.warn('❌ WebSocket Disconnected', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });

        if (event.code !== 1000) {
          const timeout = Math.min(10000, 1000 * 2 ** reconnectAttempts);
          reconnectTimeout = setTimeout(() => {
            reconnectAttempts++;
            connectWebSocket();
          }, timeout);
        }
      };
    };

    fetchMessages(1);
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        // 👇 Mark this as an intentional close (code 1000)
        wsRef.current.close(1000, 'Component unmounted or room changed');
      }
      clearTimeout(reconnectTimeout);
    };
  }, [roomId, user_id, fetchMessages]);

  useEffect(() => {
    if (page > 1) {
      fetchMessages(page);
    }
  }, [page, fetchMessages]);

  const sendMessage = useCallback(
    (message: string) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const newMessage: MessageTypes = {
          id: crypto.randomUUID(),
          senderId: user_id,
          content: message,
          createdAt: new Date().toISOString(),
          seenBy: [],
          groupChatId: '',
          privateChatId: '',
          userId: '',
        };

        setMessages((prev) => [newMessage, ...prev]);
        wsRef.current.send(JSON.stringify({ message }));
      } else {
        console.warn('WebSocket is not connected.');
      }
    },
    [user_id]
  );

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage((prev) => prev + 1);
    }
  };

  return {
    messages,
    loading,
    error,
    pagination,
    receiver,
    loadMore,
    sendMessage,
  };
}

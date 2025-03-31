import { MessageTypes } from '@/types/ChatMessageTypes';
import { useState, useEffect, useCallback, useRef } from 'react';

const API_URL = `${process.env.NEXT_PUBLIC_BASE_API_URL}/v1/private-chat`;
const WS_URL = `${process.env.NEXT_PUBLIC_BASE_WEBSOCKET_URL}/v1/personal-chat`;

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalMessages: number;
}

export function usePrivateChat(roomId: string, user_id: string) {
  const [messages, setMessages] = useState<MessageTypes[]>([]);
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
        const data = await res.json();

        if (pageNum === 1) {
          setMessages(data.messages);
        } else {
          setMessages((prev) => [...prev, ...data.messages]);
        }

        setPagination(data.pagination);
        setHasMore(data.pagination.currentPage < data.pagination.totalPages);
      } catch {
        setError('Failed to fetch messages');
      } finally {
        setLoading(false);
      }
    },
    [roomId]
  );

  useEffect(() => {
    if (!roomId) return;

    fetchMessages();

    const ws = new WebSocket(`${WS_URL}?user_id=${user_id}&room_id=${roomId}`);
    wsRef.current = ws;

    ws.onopen = () => console.log('🔗 WebSocket Connected');

    ws.onmessage = (event) => {
      const newMessage: MessageTypes = JSON.parse(event.data);
      setMessages((prev) => [newMessage, ...prev]); // Add new message at the top
    };

    ws.onerror = (error) => console.log('❌ WebSocket Error:', error);

    ws.onclose = () => console.log('❌ WebSocket Disconnected');

    return () => {
      ws.close();
    };
  }, [roomId, fetchMessages, user_id]);

  // ✅ Load More Messages
  const loadMore = () => {
    if (hasMore) {
      setPage((prev) => prev + 1);
      fetchMessages(page + 1);
    }
  };

  return {
    messages,
    loading,
    error,
    pagination,
    loadMore,
    sendMessage: wsRef.current?.send.bind(wsRef.current),
  };
}

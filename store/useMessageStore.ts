import { create } from 'zustand';
import { MessageTypes, Receiver } from '@/types/ChatMessageTypes';
import { v4 as uuidv4 } from 'uuid';

const API_URL = `${process.env.NEXT_PUBLIC_BASE_API_URL}/v1/private-chat`;
const WS_URL = `${process.env.NEXT_PUBLIC_BASE_WEBSOCKET_URL}/v1/personal-chat`;

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalMessages: number;
}

interface MessageState {
  messages: MessageTypes[];
  receiver: Receiver[];
  pagination: Pagination | null;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  loadingOlderMessages: boolean;
  ws: WebSocket | null;
  fetchMessages: (
    roomId: string,
    userId: string,
    page?: number,
    isLoadMore?: boolean
  ) => Promise<void>;
  connectWebSocket: (roomId: string, userId: string) => void;
  closeWebSocket: () => void;
  sendMessage: (msg: string, userId: string) => void;
  loadMore: () => void;
}

export const useMessageStore = create<MessageState>((set, get) => {
  let reconnectTimeout: NodeJS.Timeout;
  let reconnectAttempts = 0;

  return {
    messages: [],
    receiver: [],
    pagination: null,
    loading: true,
    error: null,
    hasMore: false,
    page: 1,
    loadingOlderMessages: false,
    ws: null,

    fetchMessages: async (roomId, userId, pageNum = 1, isLoadMore = false) => {
      if (isLoadMore) set({ loadingOlderMessages: true });
      else set({ loading: true });

      try {
        const res = await fetch(`${API_URL}?room_id=${roomId}&page=${pageNum}`);
        if (!res.ok) throw new Error('Failed to fetch');

        const data = await res.json();

        set((state) => ({
          messages:
            pageNum === 1
              ? data.data.messages
              : [...state.messages, ...data.data.messages],
          receiver: pageNum === 1 ? data.data.receiver : state.receiver,
          pagination: data.pagination,
          hasMore: data.pagination.currentPage < data.pagination.totalPages,
        }));
      } catch {
        set({ error: 'Failed to fetch messages' });
      } finally {
        set({ loading: false, loadingOlderMessages: false });
      }
    },

    connectWebSocket: (roomId, userId) => {
      const { closeWebSocket, fetchMessages } = get();

      closeWebSocket(); // ensure old connection is closed

      const ws = new WebSocket(`${WS_URL}?user_id=${userId}&room_id=${roomId}`);
      set({ ws });

      ws.onopen = () => {
        console.log('🔗 WebSocket Connected');
        reconnectAttempts = 0;
      };

      ws.onmessage = (event) => {
        try {
          const newMessage: MessageTypes = JSON.parse(event.data);
          set((state) => ({ messages: [newMessage, ...state.messages] }));
        } catch (err) {
          console.error('❌ Failed to parse message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket Error:', error);
      };

      ws.onclose = (event) => {
        console.warn('❌ WebSocket Disconnected', event);
        if (event.code !== 1000) {
          const timeout = Math.min(10000, 1000 * 2 ** reconnectAttempts);
          reconnectTimeout = setTimeout(() => {
            reconnectAttempts++;
            get().connectWebSocket(roomId, userId);
          }, timeout);
        }
      };

      fetchMessages(roomId, userId, 1);
    },

    closeWebSocket: () => {
      const { ws } = get();
      if (ws) ws.close(1000, 'Manually closed');
      clearTimeout(reconnectTimeout);
      set({ ws: null });
    },

    sendMessage: (message: string, userId: string) => {
      const { ws } = get();
      if (ws && ws.readyState === WebSocket.OPEN) {
        const newMessage: MessageTypes = {
          id:
            typeof crypto !== 'undefined' && crypto.randomUUID
              ? crypto.randomUUID()
              : uuidv4(),
          senderId: userId,
          content: message,
          createdAt: new Date().toISOString(),
          seenBy: [],
          groupChatId: '',
          privateChatId: '',
          userId: '',
        };

        set((state) => ({ messages: [newMessage, ...state.messages] }));
        ws.send(JSON.stringify({ message }));
      } else {
        console.warn('WebSocket is not connected.');
      }
    },

    loadMore: () => {
      const { page, hasMore, loading, fetchMessages } = get();
      if (!hasMore || loading) return;

      const nextPage = page + 1;
      set({ page: nextPage });
      fetchMessages('', '', nextPage, true); // call should include roomId/userId
    },
  };
});

import { ChatListType, ChatListTypeResponse } from '@/types/ChatListTypes';
import { create } from 'zustand';

type ChatListState = {
  chatList: ChatListType[];
  loading: boolean;
  error: string | null;
  fetchChatList: (userId: string) => Promise<void>;
  prependOrUpdateChat: (chat: ChatListType) => void;
  connectWebSocket: (userId: string) => void;
  disconnectWebSocket: () => void;
};

let ws: WebSocket | null = null;
let reconnectAttempts = 0;
let reconnectTimeout: NodeJS.Timeout | null = null;

export const useChatListStore = create<ChatListState>((set, get) => ({
  chatList: [],
  loading: false,
  error: null,

  fetchChatList: async (userId) => {
    if (!userId || get().chatList.length > 0) return;

    set({ loading: true, error: null });
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API_URL}/v1/chat-list?user_id=${userId}`,
        { credentials: 'include' }
      );
      if (!res.ok) throw new Error('Failed to load chat list');
      const data: ChatListTypeResponse = await res.json();
      const sorted = data.data.sort(
        (a, b) =>
          new Date(b.latestMessage.createdAt).getTime() -
          new Date(a.latestMessage.createdAt).getTime()
      );
      set({ chatList: sorted });
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  prependOrUpdateChat: (newChat) => {
    const existing = get().chatList;
    const exists = existing.some((chat) => chat.id === newChat.id);
    const updated = exists
      ? existing.map((chat) =>
          chat.id === newChat.id
            ? {
                ...chat,
                latestMessage: newChat.latestMessage,
                unreadCount: newChat.unreadCount,
              }
            : chat
        )
      : [newChat, ...existing];

    const sorted = updated.sort(
      (a, b) =>
        new Date(b.latestMessage.createdAt).getTime() -
        new Date(a.latestMessage.createdAt).getTime()
    );

    set({ chatList: sorted });
  },

  connectWebSocket: (userId) => {
    if (!userId || ws) return;

    ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_BASE_WEBSOCKET_URL}/v1/chat-list?user_id=${userId}`
    );

    ws.onopen = () => {
      console.log('🔗 Chat List WebSocket Connected');
      reconnectAttempts = 0;
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.updated && data.chat) {
        get().prependOrUpdateChat(data.chat);
      }
    };

    ws.onerror = (err) => {
      console.error('❌ WebSocket Error:', err);
    };

    ws.onclose = () => {
      console.warn('❌ WebSocket Disconnected');
      if (reconnectAttempts > 5) return;

      reconnectTimeout = setTimeout(() => {
        reconnectAttempts++;
        get().connectWebSocket(userId);
      }, Math.min(10000, 1000 * 2 ** reconnectAttempts));
    };
  },

  disconnectWebSocket: () => {
    if (ws) {
      ws.close();
      ws = null;
    }
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
  },
}));

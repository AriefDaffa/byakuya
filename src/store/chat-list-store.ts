import type { ChatListItem } from '@/types/chat';
import { create } from 'zustand';

interface ChatListState {
  /** Sidebar search keyword */
  searchKeyword: string;
  /** Chat list data */
  chatList: ChatListItem[];
}

interface ChatListActions {
  setSearchKeyword: (keyword: string) => void;
  setChatList: (list: ChatListItem[]) => void;
  updateChatListMessage: (conversationId: string, content: string) => void;
  addChatListItem: (item: ChatListItem) => void;
}

export const useChatListStore = create<ChatListState & ChatListActions>((set, get) => ({
  searchKeyword: '',
  chatList: [],

  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),

  setChatList: (list) => {
    const sorted = [...list].sort((a, b) => {
      const dateA = a.lastMessage
        ? new Date(a.lastMessage.created_at).getTime()
        : new Date(a.conversation.updated_at).getTime();
      const dateB = b.lastMessage
        ? new Date(b.lastMessage.created_at).getTime()
        : new Date(b.conversation.updated_at).getTime();
      return dateB - dateA;
    });
    set({ chatList: sorted });
  },

  updateChatListMessage: (conversationId, content) => {
    const current = get().chatList;
    const updated = current.map((item) =>
      item.conversation.id === conversationId
        ? {
            ...item,
            lastMessage: {
              id: crypto.randomUUID(),
              conversation_id: conversationId,
              sender_id: '',
              content,
              type: 'text' as const,
              is_edited: false,
              is_deleted: false,
              reply_to_id: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          }
        : item,
    );
    get().setChatList(updated);
  },

  addChatListItem: (item) => {
    const current = get().chatList;
    const exists = current.some((c) => c.conversation.id === item.conversation.id);
    if (!exists) {
      get().setChatList([item, ...current]);
    }
  },
}));

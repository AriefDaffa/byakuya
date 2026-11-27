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
  addChatListItem: (item: ChatListItem) => void;
  resetChatList: () => void;
}

function sortByLatestActivity(list: ChatListItem[]): ChatListItem[] {
  return [...list].sort((a, b) => {
    const dateA = a.lastMessage
      ? new Date(a.lastMessage.created_at).getTime()
      : new Date(a.conversation.updated_at).getTime();
    const dateB = b.lastMessage
      ? new Date(b.lastMessage.created_at).getTime()
      : new Date(b.conversation.updated_at).getTime();
    return dateB - dateA;
  });
}

export const useChatListStore = create<ChatListState & ChatListActions>((set, get) => ({
  searchKeyword: '',
  chatList: [],

  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),

  setChatList: (list) => {
    set({ chatList: sortByLatestActivity(list) });
  },

  addChatListItem: (item) => {
    const current = get().chatList;
    const exists = current.some((c) => c.conversation.id === item.conversation.id);
    if (!exists) {
      get().setChatList([item, ...current]);
    }
  },

  resetChatList: () => set({ searchKeyword: '', chatList: [] }),
}));

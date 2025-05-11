import { ChatListData } from '@/types/ChatListTypes';
import { create } from 'zustand';

interface ChatListStore {
  searchKeyword: string;
  mutatedData: ChatListData[];
}
interface ChatListStoreAction {
  setSearchKeyword: (state: string) => void;
  setMutatedData: (state: ChatListData[]) => void;
}

export const useChatListStore = create<ChatListStore & ChatListStoreAction>(
  (set) => ({
    searchKeyword: '',
    mutatedData: [],

    setSearchKeyword: (state) => set({ searchKeyword: state }),
    setMutatedData: (state) => {
      const sorted = state.sort((a, b) => {
        const dateA = new Date(a.latestMessage.createdAt).getTime();
        const dateB = new Date(b.latestMessage.createdAt).getTime();

        return dateB - dateA;
      });

      set({ mutatedData: sorted });
    },
  })
);

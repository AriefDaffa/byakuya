import { UserTypes } from '@/types/common/UserTypes';
import { create } from 'zustand';

interface ChatStore {
  messageKeyword: string;
  openChatSlider: boolean;
  openProfile: boolean;
  page: number;
  selectedUser: UserTypes;
}

interface ChatStoreAction {
  incrementPage: () => void;
  setMessageKeyword: (state: string) => void;
  setOpenChatSlider: () => void;
  setOpenProfile: () => void;
  setSelectedUser: (state: UserTypes) => void;
}

export const useChatStore = create<ChatStore & ChatStoreAction>((set, get) => ({
  messageKeyword: '',
  selectedUser: {
    id: '',
    name: '',
    email: '',
    image: '',
  },
  openChatSlider: false,
  openProfile: false,
  page: 1,

  setMessageKeyword: (state) => set(() => ({ messageKeyword: state })),
  setOpenChatSlider: () => set({ openChatSlider: !get().openChatSlider }),
  setOpenProfile: () => set({ openProfile: !get().openProfile }),
  incrementPage: () => set({ page: get().page + 1 }),
  setSelectedUser: (state) => set(() => ({ selectedUser: state })),
}));

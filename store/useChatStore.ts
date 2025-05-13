import { SelectedUser } from '@/types/SelectUserTypes';
import { create } from 'zustand';

interface ChatStore {
  messageKeyword: string;
  openChatSlider: boolean;
  openProfile: boolean;
  page: number;
  selectedRoom: SelectedUser;
}

interface ChatStoreAction {
  incrementPage: () => void;
  setSelectedRoom: (state: SelectedUser) => void;
  setMessageKeyword: (state: string) => void;
  setOpenChatSlider: () => void;
  setOpenProfile: () => void;
}

export const useChatStore = create<ChatStore & ChatStoreAction>((set, get) => ({
  messageKeyword: '',
  selectedRoom: {
    user: {
      email: '',
      id: '',
      image: '',
      name: '',
    },
    roomId: '',
  },
  openChatSlider: false,
  openProfile: false,
  page: 1,

  setSelectedRoom: (state) => set(() => ({ selectedRoom: state, page: 1 })),
  setMessageKeyword: (state) => set(() => ({ messageKeyword: state })),
  setOpenChatSlider: () => set({ openChatSlider: !get().openChatSlider }),
  setOpenProfile: () => set({ openProfile: !get().openProfile }),
  incrementPage: () => set({ page: get().page + 1 }),
}));

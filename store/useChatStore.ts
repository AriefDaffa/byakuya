import { SelectedUser } from '@/types/SelectUserTypes';
import { create } from 'zustand';

interface ChatStore {
  messageKeyword: string;
  selectedRoom: SelectedUser;
}

interface ChatStoreAction {
  setSelectedRoom: (state: SelectedUser) => void;
  setMessageKeyword: (state: string) => void;
}

export const useChatStore = create<ChatStore & ChatStoreAction>((set) => ({
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

  setSelectedRoom: (state) => set(() => ({ selectedRoom: state })),
  setMessageKeyword: (state) => set(() => ({ messageKeyword: state })),
}));

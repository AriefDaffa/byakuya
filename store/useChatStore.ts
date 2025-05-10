import {
  ChatMessageTypes,
  ChatMessageTypesResponse,
} from '@/types/ChatMessageTypes';
import { SelectedUser } from '@/types/SelectUserTypes';
import { create } from 'zustand';

interface ChatStore {
  page: number;
  messageKeyword: string;
  isLoading: boolean;
  error: string;
  selectedRoom: SelectedUser;
  data: ChatMessageTypes;
}

interface ChatStoreAction {
  setSelectedRoom: (state: SelectedUser) => void;
  setMessageKeyword: (state: string) => void;
  fetchMessages: () => void;
}

const API_URL = `${process.env.NEXT_PUBLIC_BASE_API_URL}/v1/private-chat`;
// const WS_URL = `${process.env.NEXT_PUBLIC_BASE_WEBSOCKET_URL}/v1/personal-chat`;

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
  page: 1,
  isLoading: true,
  error: '',
  data: {
    messages: [],
    receiver: [],
    pagination: { currentPage: 0, totalMessages: 0, totalPages: 0 },
  },

  setSelectedRoom: (state) => set(() => ({ selectedRoom: state, page: 1 })),
  setMessageKeyword: (state) => set(() => ({ messageKeyword: state })),
  fetchMessages: async () => {
    const { selectedRoom, page } = get();

    try {
      const res = await fetch(
        `${API_URL}?room_id=${selectedRoom.roomId}&page=${page}`,
        {
          credentials: 'include',
        }
      );

      if (!res.ok) throw new Error('Failed to fetch');

      const data: ChatMessageTypesResponse = await res.json();

      set({ data: data.data });
    } catch (err) {
      set({ error: String(err) });
    } finally {
      set({ isLoading: false });
    }
  },
}));

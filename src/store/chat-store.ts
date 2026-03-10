import type { Profile } from '@/types/database';
import type { EditingMessage } from '@/types/chat';
import { create } from 'zustand';

interface ChatState {
  /** Currently selected user to chat with */
  selectedUser: Profile | null;
  /** Current conversation ID */
  conversationId: string | null;
  /** Message input text */
  messageInput: string;
  /** Mobile chat slider open */
  isChatSliderOpen: boolean;
  /** Profile sheet open */
  isProfileOpen: boolean;
  /** Current page for message pagination */
  page: number;
  /** Message currently being edited */
  editingMessage: EditingMessage | null;
}

interface ChatActions {
  setSelectedUser: (user: Profile | null) => void;
  setConversationId: (id: string | null) => void;
  setMessageInput: (text: string) => void;
  toggleChatSlider: () => void;
  toggleProfile: () => void;
  incrementPage: () => void;
  resetPage: () => void;
  resetChat: () => void;
  setEditingMessage: (msg: EditingMessage | null) => void;
}

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  selectedUser: null,
  conversationId: null,
  messageInput: '',
  isChatSliderOpen: false,
  isProfileOpen: false,
  page: 1,
  editingMessage: null,

  setSelectedUser: (user) => set({ selectedUser: user, page: 1 }),
  setConversationId: (id) => set({ conversationId: id }),
  setMessageInput: (text) => set({ messageInput: text }),
  toggleChatSlider: () => set({ isChatSliderOpen: !get().isChatSliderOpen }),
  toggleProfile: () => set({ isProfileOpen: !get().isProfileOpen }),
  incrementPage: () => set({ page: get().page + 1 }),
  resetPage: () => set({ page: 1 }),
  setEditingMessage: (msg) => set({ editingMessage: msg }),
  resetChat: () =>
    set({
      selectedUser: null,
      conversationId: null,
      messageInput: '',
      page: 1,
      editingMessage: null,
    }),
}));

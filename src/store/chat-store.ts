import type { Profile } from '@/types/database';
import type {
  ChatListItem,
  EditingMessage,
  MessageWithSender,
  ReplyPreview,
} from '@/types/chat';
import { create } from 'zustand';

type MessagesUpdater =
  | MessageWithSender[]
  | ((previous: MessageWithSender[]) => MessageWithSender[]);

interface ChatState {
  /** Currently selected user to chat with (private chats) */
  selectedUser: Profile | null;
  /** Currently selected conversation metadata (supports both private & group) */
  selectedConversation: ChatListItem | null;
  /** Current conversation ID */
  conversationId: string | null;
  /** Messages for the active conversation */
  messages: MessageWithSender[];
  /** Message input text */
  messageInput: string;
  /** Mobile chat slider open */
  isChatSliderOpen: boolean;
  /** Profile sheet open */
  isProfileOpen: boolean;
  /** Current page for message pagination */
  page: number;
  /** Whether older messages are still available */
  hasMore: boolean;
  /** Message currently being edited */
  editingMessage: EditingMessage | null;
  /** Message currently being replied to */
  replyingTo: ReplyPreview | null;
  /** In-chat search bar open */
  inChatSearchOpen: boolean;
  /** Pinned messages drawer open */
  pinnedDrawerOpen: boolean;
  /** Temporarily highlighted message ID (from search/pin jump) */
  highlightedMessageId: string | null;
}

interface ChatActions {
  setSelectedUser: (user: Profile | null) => void;
  setSelectedConversation: (item: ChatListItem | null) => void;
  setConversationId: (id: string | null) => void;
  setMessages: (messages: MessagesUpdater) => void;
  setMessageInput: (text: string) => void;
  toggleChatSlider: () => void;
  toggleProfile: () => void;
  incrementPage: () => void;
  resetPage: () => void;
  setHasMore: (hasMore: boolean) => void;
  resetChat: () => void;
  setEditingMessage: (msg: EditingMessage | null) => void;
  setReplyingTo: (reply: ReplyPreview | null) => void;
  setInChatSearchOpen: (open: boolean) => void;
  setPinnedDrawerOpen: (open: boolean) => void;
  setHighlightedMessageId: (id: string | null) => void;
}

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  selectedUser: null,
  selectedConversation: null,
  conversationId: null,
  messages: [],
  messageInput: '',
  isChatSliderOpen: false,
  isProfileOpen: false,
  page: 1,
  hasMore: false,
  editingMessage: null,
  replyingTo: null,
  inChatSearchOpen: false,
  pinnedDrawerOpen: false,
  highlightedMessageId: null,

  setSelectedUser: (user) => set({ selectedUser: user, page: 1 }),
  setSelectedConversation: (item) => set({ selectedConversation: item, page: 1 }),
  setConversationId: (id) => set({ conversationId: id }),
  setMessages: (messages) =>
    set((state) => ({
      messages: typeof messages === 'function' ? messages(state.messages) : messages,
    })),
  setMessageInput: (text) => set({ messageInput: text }),
  toggleChatSlider: () => set({ isChatSliderOpen: !get().isChatSliderOpen }),
  toggleProfile: () => set({ isProfileOpen: !get().isProfileOpen }),
  incrementPage: () => set({ page: get().page + 1 }),
  resetPage: () => set({ page: 1 }),
  setHasMore: (hasMore) => set({ hasMore }),
  setEditingMessage: (msg) => set({ editingMessage: msg }),
  setReplyingTo: (reply) => set({ replyingTo: reply }),
  setInChatSearchOpen: (open) => set({ inChatSearchOpen: open }),
  setPinnedDrawerOpen: (open) => set({ pinnedDrawerOpen: open }),
  setHighlightedMessageId: (id) => set({ highlightedMessageId: id }),
  resetChat: () =>
    set({
      selectedUser: null,
      selectedConversation: null,
      conversationId: null,
      messages: [],
      messageInput: '',
      isChatSliderOpen: false,
      isProfileOpen: false,
      page: 1,
      hasMore: false,
      editingMessage: null,
      replyingTo: null,
      inChatSearchOpen: false,
      pinnedDrawerOpen: false,
      highlightedMessageId: null,
    }),
}));

import { beforeEach, describe, expect, it } from 'vitest';
import type { Conversation, Message, Profile } from '@/types/database';
import type { ChatListItem, MessageWithSender } from '@/types/chat';
import { useChatStore } from '@/store/chat-store';
import { useChatListStore } from '@/store/chat-list-store';

const alice: Profile = {
  id: 'user-alice',
  name: 'Alice',
  email: 'alice@example.com',
  avatar_url: null,
  status: 'online',
  last_seen: '2026-01-01T00:00:00.000Z',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

const bob: Profile = {
  ...alice,
  id: 'user-bob',
  name: 'Bob',
  email: 'bob@example.com',
};

function makeConversation(id: string, updatedAt: string): Conversation {
  return {
    id,
    type: 'private',
    name: null,
    avatar_url: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: updatedAt,
  };
}

function makeMessage(id: string, conversationId: string, createdAt: string): Message {
  return {
    id,
    conversation_id: conversationId,
    sender_id: alice.id,
    content: `message ${id}`,
    type: 'text',
    is_edited: false,
    is_deleted: false,
    reply_to_id: null,
    created_at: createdAt,
    updated_at: createdAt,
  };
}

function makeMessageWithSender(
  id: string,
  conversationId: string,
  createdAt: string,
): MessageWithSender {
  return {
    ...makeMessage(id, conversationId, createdAt),
    sender: alice,
  };
}

function makeChatListItem(
  conversation: Conversation,
  lastMessage: Message | null,
): ChatListItem {
  return {
    conversation,
    otherUser: bob,
    lastMessage,
    unreadCount: 0,
  };
}

describe('useChatStore', () => {
  beforeEach(() => {
    useChatStore.getState().resetChat();
  });

  it('starts from a clean state', () => {
    const state = useChatStore.getState();

    expect(state.selectedUser).toBeNull();
    expect(state.conversationId).toBeNull();
    expect(state.messages).toEqual([]);
    expect(state.messageInput).toBe('');
    expect(state.editingMessage).toBeNull();
    expect(state.page).toBe(1);
    expect(state.hasMore).toBe(false);
  });

  it('selects a user and resets pagination', () => {
    const { incrementPage, setSelectedUser } = useChatStore.getState();

    incrementPage();
    incrementPage();
    expect(useChatStore.getState().page).toBe(3);

    setSelectedUser(alice);

    const state = useChatStore.getState();
    expect(state.selectedUser).toEqual(alice);
    expect(state.page).toBe(1);
  });

  it('tracks conversation, messages, input and editing state', () => {
    const message = makeMessageWithSender('m1', 'conv-1', '2026-01-01T00:00:00.000Z');
    const {
      setConversationId,
      setMessages,
      setMessageInput,
      setEditingMessage,
      setHasMore,
      incrementPage,
    } = useChatStore.getState();

    setConversationId('conv-1');
    setMessages([message]);
    setMessageInput('hello');
    setEditingMessage({ id: message.id, content: message.content ?? '' });
    setHasMore(true);
    incrementPage();

    const state = useChatStore.getState();
    expect(state.conversationId).toBe('conv-1');
    expect(state.messages).toEqual([message]);
    expect(state.messageInput).toBe('hello');
    expect(state.editingMessage).toEqual({ id: 'm1', content: 'message m1' });
    expect(state.hasMore).toBe(true);
    expect(state.page).toBe(2);
  });

  it('supports functional message updates', () => {
    const first = makeMessageWithSender('m1', 'conv-1', '2026-01-01T00:00:00.000Z');
    const second = makeMessageWithSender('m2', 'conv-1', '2026-01-01T00:01:00.000Z');
    const { setMessages } = useChatStore.getState();

    setMessages([first]);
    setMessages((previous) => [...previous, second]);

    expect(useChatStore.getState().messages.map((message) => message.id)).toEqual([
      'm1',
      'm2',
    ]);
  });

  it('resetChat clears every conversation field', () => {
    const state = useChatStore.getState();
    state.setSelectedUser(alice);
    state.setConversationId('conv-1');
    state.setMessages([
      makeMessageWithSender('m1', 'conv-1', '2026-01-01T00:00:00.000Z'),
    ]);
    state.setMessageInput('draft');
    state.setEditingMessage({ id: 'm1', content: 'message m1' });
    state.setHasMore(true);
    state.incrementPage();
    state.toggleChatSlider();
    state.toggleProfile();

    useChatStore.getState().resetChat();

    const reset = useChatStore.getState();
    expect(reset.selectedUser).toBeNull();
    expect(reset.conversationId).toBeNull();
    expect(reset.messages).toEqual([]);
    expect(reset.messageInput).toBe('');
    expect(reset.editingMessage).toBeNull();
    expect(reset.hasMore).toBe(false);
    expect(reset.page).toBe(1);
    expect(reset.isChatSliderOpen).toBe(false);
    expect(reset.isProfileOpen).toBe(false);
  });
});

describe('useChatListStore', () => {
  beforeEach(() => {
    useChatListStore.getState().resetChatList();
  });

  it('starts empty', () => {
    const state = useChatListStore.getState();

    expect(state.searchKeyword).toBe('');
    expect(state.chatList).toEqual([]);
  });

  it('sorts the chat list by latest activity', () => {
    const older = makeChatListItem(
      makeConversation('conv-older', '2026-01-01T00:00:00.000Z'),
      makeMessage('m-older', 'conv-older', '2026-01-01T00:05:00.000Z'),
    );
    const newer = makeChatListItem(
      makeConversation('conv-newer', '2026-01-02T00:00:00.000Z'),
      makeMessage('m-newer', 'conv-newer', '2026-01-02T00:05:00.000Z'),
    );

    useChatListStore.getState().setChatList([older, newer]);

    expect(
      useChatListStore.getState().chatList.map((item) => item.conversation.id),
    ).toEqual(['conv-newer', 'conv-older']);
  });

  it('falls back to conversation updated_at when there is no last message', () => {
    const withMessage = makeChatListItem(
      makeConversation('conv-message', '2026-01-01T00:00:00.000Z'),
      makeMessage('m1', 'conv-message', '2026-01-01T10:00:00.000Z'),
    );
    const withoutMessage = makeChatListItem(
      makeConversation('conv-empty', '2026-01-02T00:00:00.000Z'),
      null,
    );

    useChatListStore.getState().setChatList([withMessage, withoutMessage]);

    expect(
      useChatListStore.getState().chatList.map((item) => item.conversation.id),
    ).toEqual(['conv-empty', 'conv-message']);
  });

  it('adds chat list items without duplicating conversations', () => {
    const first = makeChatListItem(
      makeConversation('conv-1', '2026-01-01T00:00:00.000Z'),
      null,
    );
    const { addChatListItem } = useChatListStore.getState();

    addChatListItem(first);
    addChatListItem(first);

    expect(useChatListStore.getState().chatList).toHaveLength(1);
  });

  it('resetChatList clears search keyword and data', () => {
    const item = makeChatListItem(
      makeConversation('conv-1', '2026-01-01T00:00:00.000Z'),
      null,
    );

    useChatListStore.getState().setSearchKeyword('alice');
    useChatListStore.getState().setChatList([item]);

    useChatListStore.getState().resetChatList();

    const state = useChatListStore.getState();
    expect(state.searchKeyword).toBe('');
    expect(state.chatList).toEqual([]);
  });
});

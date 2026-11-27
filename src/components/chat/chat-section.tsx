'use client';

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pin, Search, X } from 'lucide-react';
import { useChatRoom } from '@/hooks/use-chat-room';
import { useChatStore } from '@/store/chat-store';
import { ChatHeader } from '@/components/chat/chat-header';
import { MessageGroupComponent } from '@/components/chat/message-group';
import { MessageInput } from '@/components/chat/message-input';
import { Loader } from '@/components/ui/loader';
import {
  getPinnedMessages,
  searchConversationMessages,
} from '@/features/chat/actions';
import { formatChatTimestamp, formatMessageDate } from '@/lib/format';
import type { MessageWithSender } from '@/types/chat';

export function ChatSection() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  const selectedUser = useChatStore((state) => state.selectedUser);
  const selectedConversation = useChatStore((state) => state.selectedConversation);
  const conversationId = useChatStore((state) => state.conversationId);
  const messageInput = useChatStore((state) => state.messageInput);
  const setMessageInput = useChatStore((state) => state.setMessageInput);
  const toggleProfile = useChatStore((state) => state.toggleProfile);
  const incrementPage = useChatStore((state) => state.incrementPage);
  const editingMessage = useChatStore((state) => state.editingMessage);
  const setEditingMessage = useChatStore((state) => state.setEditingMessage);
  const replyingTo = useChatStore((state) => state.replyingTo);
  const setReplyingTo = useChatStore((state) => state.setReplyingTo);
  const inChatSearchOpen = useChatStore((state) => state.inChatSearchOpen);
  const setInChatSearchOpen = useChatStore((state) => state.setInChatSearchOpen);
  const pinnedDrawerOpen = useChatStore((state) => state.pinnedDrawerOpen);
  const setPinnedDrawerOpen = useChatStore((state) => state.setPinnedDrawerOpen);
  const highlightedMessageId = useChatStore((state) => state.highlightedMessageId);
  const setHighlightedMessageId = useChatStore(
    (state) => state.setHighlightedMessageId,
  );

  const [inChatQuery, setInChatQuery] = useState('');
  const [inChatResults, setInChatResults] = useState<MessageWithSender[]>([]);
  const [isSearchingInChat, setIsSearchingInChat] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<MessageWithSender[]>([]);

  const {
    messages,
    messageGroups,
    isLoading,
    isFetching,
    totalPages,
    currentPage,
    currentUserId,
    typingUsers,
    sendTyping,
    sendMessage,
    sendAttachment,
    editMessage,
    deleteMessage,
    toggleReaction,
    togglePin,
  } = useChatRoom();

  // Scroll to the bottom on initial load and when a message is appended at the
  // end of the list. Loading older pages prepends messages and must not move
  // the viewport.
  useEffect(() => {
    const lastGroup = messageGroups[messageGroups.length - 1];
    const lastMessage = lastGroup?.messages[lastGroup.messages.length - 1];
    const lastMessageId = lastMessage?.id ?? null;

    if (lastMessageId !== null && lastMessageId !== lastMessageIdRef.current) {
      messagesEndRef.current?.scrollIntoView({
        behavior: lastMessageIdRef.current === null ? 'auto' : 'smooth',
      });
    }

    lastMessageIdRef.current = lastMessageId;
  }, [messageGroups]);

  // Handle edit initiation - populate input with message content
  const handleEdit = useCallback(
    (messageId: string, content: string) => {
      setEditingMessage({ id: messageId, content });
      setMessageInput(content);
    },
    [setEditingMessage, setMessageInput],
  );

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    setEditingMessage(null);
    setMessageInput('');
  }, [setEditingMessage, setMessageInput]);

  // Handle send or save edit
  const handleSend = useCallback(async () => {
    if (editingMessage) {
      const success = await editMessage(editingMessage.id, messageInput.trim());
      if (success) {
        setMessageInput('');
      }
    } else {
      sendMessage();
    }
  }, [editingMessage, editMessage, messageInput, setMessageInput, sendMessage]);

  // Handle delete with confirmation
  const handleDelete = useCallback(
    async (messageId: string) => {
      await deleteMessage(messageId);
    },
    [deleteMessage],
  );

  // Handle attachment
  const handleSendAttachment = useCallback(
    async (file: File, caption?: string) => {
      await sendAttachment(file, caption);
    },
    [sendAttachment],
  );

  const handleReply = useCallback(
    (msg: MessageWithSender) => {
      setEditingMessage(null);
      setReplyingTo({
        id: msg.id,
        senderId: msg.sender_id,
        senderName: msg.sender?.name || 'User',
        content: msg.content,
        isDeleted: Boolean(msg.is_deleted),
      });
    },
    [setEditingMessage, setReplyingTo],
  );

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, [setReplyingTo]);

  const jumpToMessage = useCallback(
    (messageId: string) => {
      setHighlightedMessageId(messageId);
      const el = document.getElementById(`msg-${messageId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        setHighlightedMessageId(null);
      }, 2500);
    },
    [setHighlightedMessageId],
  );

  useEffect(() => {
    if (!conversationId || !pinnedDrawerOpen) return;
    void getPinnedMessages(conversationId).then((res) => {
      if (res.data) {
        setPinnedMessages(res.data as MessageWithSender[]);
      }
    });
  }, [conversationId, pinnedDrawerOpen, messages]);

  const handleInChatSearch = useCallback(
    async (term: string) => {
      setInChatQuery(term);
      if (!conversationId || term.trim().length < 2) {
        setInChatResults([]);
        return;
      }
      setIsSearchingInChat(true);
      const res = await searchConversationMessages(conversationId, term);
      setIsSearchingInChat(false);
      if (res.data) {
        setInChatResults(res.data as MessageWithSender[]);
      }
    },
    [conversationId],
  );

  const localPinnedCount = useMemo(
    () => messages.filter((m) => m.is_pinned && !m.is_deleted).length,
    [messages],
  );

  // Insert a pixel date separator whenever the calendar day changes.
  const groupsWithDateDividers = messageGroups.map((group, index) => {
    const dateLabel = group.messages[0]
      ? formatMessageDate(group.messages[0].created_at)
      : undefined;
    const previousGroup = messageGroups[index - 1];
    const previousDateLabel = previousGroup?.messages[0]
      ? formatMessageDate(previousGroup.messages[0].created_at)
      : undefined;

    return {
      group,
      dateLabel: dateLabel && dateLabel !== previousDateLabel ? dateLabel : null,
    };
  });

  const isGroupChat = selectedConversation?.conversation.type === 'group';
  const headerName = isGroupChat
    ? selectedConversation.conversation.name || 'Group Room'
    : selectedUser?.name || '';
  const headerAvatar = isGroupChat
    ? selectedConversation.conversation.avatar_url || ''
    : selectedUser?.avatar_url || '';

  if (!selectedUser && !selectedConversation) {
    return (
      <div className="text-muted-foreground flex size-full items-center justify-center border-r border-b">
        Select a chat to start messaging
      </div>
    );
  }

  return (
    <div className="relative flex size-full flex-col border-r border-b">
      <ChatHeader
        avatar={headerAvatar}
        name={headerName}
        status={isGroupChat ? null : selectedUser?.status}
        isGroup={isGroupChat}
        memberCount={isGroupChat ? selectedConversation?.members?.length : undefined}
        pinnedCount={localPinnedCount}
        onProfileClick={toggleProfile}
        onSearchToggle={() => {
          setInChatSearchOpen(!inChatSearchOpen);
          setPinnedDrawerOpen(false);
        }}
        onPinnedToggle={() => {
          setPinnedDrawerOpen(!pinnedDrawerOpen);
          setInChatSearchOpen(false);
        }}
      />

      {/* In-Chat Search Bar */}
      {inChatSearchOpen && (
        <div className="border-b-2 border-[#090c12] bg-[#1e243d] px-4 py-2.5 text-[#f8fafc]">
          <div className="flex items-center gap-2">
            <Search className="size-4 shrink-0 text-[var(--unread)]" />
            <input
              type="text"
              value={inChatQuery}
              onChange={(e) => void handleInChatSearch(e.target.value)}
              placeholder="Search messages in this chat..."
              className="pixel-input h-9 min-w-0 flex-1 rounded-none px-3 font-sans text-sm outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={() => {
                setInChatSearchOpen(false);
                setInChatQuery('');
                setInChatResults([]);
              }}
              className="pixel-btn bg-card text-foreground inline-flex size-8 items-center justify-center"
              aria-label="Close in-chat search"
            >
              <X className="size-4" />
            </button>
          </div>
          {inChatQuery.trim().length >= 2 && (
            <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
              {isSearchingInChat ? (
                <p className="font-mono text-xs opacity-75">Searching...</p>
              ) : inChatResults.length === 0 ? (
                <p className="font-mono text-xs opacity-75">No matching messages</p>
              ) : (
                inChatResults.map((msg) => (
                  <button
                    key={msg.id}
                    type="button"
                    onClick={() => jumpToMessage(msg.id)}
                    className="hover:bg-[#2c3766] flex w-full items-center justify-between gap-2 border border-[#090c12] bg-[#232a42] px-2.5 py-1.5 text-left text-xs"
                  >
                    <span className="truncate">
                      <strong className="text-[var(--unread)]">{msg.sender.name}: </strong>
                      {msg.content}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] opacity-75">
                      {formatChatTimestamp(msg.created_at)}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Pinned Messages Drawer */}
      {pinnedDrawerOpen && (
        <div className="border-b-2 border-[#090c12] bg-[#1e243d] px-4 py-2.5 text-[#f8fafc]">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-mono text-xs font-bold text-[var(--unread)] uppercase">
              <Pin className="size-3.5" /> Pinned Messages ({pinnedMessages.length})
            </span>
            <button
              type="button"
              onClick={() => setPinnedDrawerOpen(false)}
              className="pixel-btn bg-card text-foreground inline-flex size-7 items-center justify-center"
              aria-label="Close pinned messages"
            >
              <X className="size-3.5" />
            </button>
          </div>
          {pinnedMessages.length === 0 ? (
            <p className="font-mono text-xs opacity-75">No pinned messages yet</p>
          ) : (
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {pinnedMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="flex items-center justify-between gap-2 border border-[#090c12] bg-[#232a42] px-2.5 py-1.5 text-xs"
                >
                  <button
                    type="button"
                    onClick={() => jumpToMessage(msg.id)}
                    className="min-w-0 flex-1 truncate text-left hover:underline"
                  >
                    <strong className="text-[var(--unread)]">{msg.sender.name}: </strong>
                    {msg.content || 'Attachment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void togglePin(msg.id)}
                    className="text-muted-foreground hover:text-destructive shrink-0 font-mono text-[10px]"
                  >
                    Unpin
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <Loader />
        ) : (
          <div className="flex h-full flex-col">
            <div className="pixel-dither-bg flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {currentPage < totalPages && (
                <div className="flex w-full items-center justify-center">
                  <button
                    type="button"
                    onClick={incrementPage}
                    disabled={isFetching}
                    className="pixel-btn bg-card cursor-pointer px-4 py-2 font-sans text-xs font-semibold tracking-wide disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isFetching ? 'Loading...' : 'Load older messages'}
                  </button>
                </div>
              )}
              {groupsWithDateDividers.map(({ group, dateLabel }, idx) => (
                <Fragment key={group.messages[0]?.id ?? idx}>
                  {dateLabel && (
                    <div className="my-2 flex w-full items-center justify-center">
                      <span className="pixel-box bg-card px-3 py-1 font-sans text-xs font-semibold tracking-wide opacity-80">
                        {dateLabel}
                      </span>
                    </div>
                  )}
                  <MessageGroupComponent
                    currentUserId={currentUserId || ''}
                    isGroupChat={isGroupChat}
                    highlightedMessageId={highlightedMessageId}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onReply={handleReply}
                    onReact={(msgId, emoji) => void toggleReaction(msgId, emoji)}
                    onPin={(msgId) => void togglePin(msgId)}
                    {...group}
                  />
                </Fragment>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Typing Indicator Strip */}
      {typingUsers.length > 0 && (
        <div className="border-t border-[#090c12] bg-[#1e243d] px-4 py-1 font-mono text-xs text-[var(--online)]">
          {typingUsers.map((u) => u.userName).join(', ')}{' '}
          {typingUsers.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      <MessageInput
        value={messageInput}
        onChange={setMessageInput}
        onSend={handleSend}
        onSendAttachment={handleSendAttachment}
        editingMessage={editingMessage}
        onCancelEdit={handleCancelEdit}
        replyingTo={replyingTo}
        onCancelReply={handleCancelReply}
        onTyping={sendTyping}
      />
    </div>
  );
}

'use client';

import { Fragment, useCallback, useEffect, useRef } from 'react';
import { useChatRoom } from '@/hooks/use-chat-room';
import { useChatStore } from '@/store/chat-store';
import { ChatHeader } from '@/components/chat/chat-header';
import { MessageGroupComponent } from '@/components/chat/message-group';
import { MessageInput } from '@/components/chat/message-input';
import { Loader } from '@/components/ui/loader';
import { formatMessageDate } from '@/lib/format';

export function ChatSection() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  const selectedUser = useChatStore((state) => state.selectedUser);
  const messageInput = useChatStore((state) => state.messageInput);
  const setMessageInput = useChatStore((state) => state.setMessageInput);
  const toggleProfile = useChatStore((state) => state.toggleProfile);
  const incrementPage = useChatStore((state) => state.incrementPage);
  const editingMessage = useChatStore((state) => state.editingMessage);
  const setEditingMessage = useChatStore((state) => state.setEditingMessage);

  const {
    messageGroups,
    isLoading,
    isFetching,
    totalPages,
    currentPage,
    currentUserId,
    sendMessage,
    sendAttachment,
    editMessage,
    deleteMessage,
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

  if (!selectedUser) {
    return (
      <div className="text-muted-foreground flex size-full items-center justify-center border-r border-b">
        Select a chat to start messaging
      </div>
    );
  }

  return (
    <div className="relative flex size-full flex-col border-r border-b">
      <ChatHeader
        avatar={selectedUser.avatar_url || ''}
        name={selectedUser.name}
        status={selectedUser.status}
        onProfileClick={toggleProfile}
      />

      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <Loader />
        ) : (
          <div className="flex h-full flex-col">
            <div className="pixel-dither-bg flex-1 overflow-y-auto p-4">
              {currentPage < totalPages && (
                <div className="mb-4 flex w-full items-center justify-center">
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
                    <div className="my-4 flex w-full items-center justify-center">
                      <span className="pixel-box bg-card px-3 py-1 font-sans text-xs font-semibold tracking-wide">
                        {dateLabel}
                      </span>
                    </div>
                  )}
                  <MessageGroupComponent
                    currentUserId={currentUserId || ''}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    {...group}
                  />
                </Fragment>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      <MessageInput
        value={messageInput}
        onChange={setMessageInput}
        onSend={handleSend}
        onSendAttachment={handleSendAttachment}
        editingMessage={editingMessage}
        onCancelEdit={handleCancelEdit}
      />
    </div>
  );
}

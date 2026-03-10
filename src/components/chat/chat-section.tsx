'use client';

import { useEffect, useRef } from 'react';
import { useChatRoom } from '@/hooks/use-chat-room';
import { useChatStore } from '@/store/chat-store';
import { ChatHeader } from '@/components/chat/chat-header';
import { MessageGroupComponent } from '@/components/chat/message-group';
import { MessageInput } from '@/components/chat/message-input';
import { Loader } from '@/components/ui/loader';

interface ChatSectionProps {
  withHeader?: boolean;
}

export function ChatSection({ withHeader = true }: ChatSectionProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { selectedUser, messageInput, setMessageInput, toggleProfile, incrementPage } =
    useChatStore();

  const {
    messageGroups,
    isLoading,
    isFetching,
    totalPages,
    currentPage,
    currentUserId,
    sendMessage,
  } = useChatRoom();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messageGroups]);

  if (!selectedUser) {
    return (
      <div className="text-muted-foreground flex size-full items-center justify-center border-r border-b">
        Select a chat to start messaging
      </div>
    );
  }

  return (
    <div className="relative flex size-full flex-col border-r border-b">
      {withHeader && (
        <ChatHeader
          avatar={selectedUser.avatar_url || ''}
          name={selectedUser.name}
          status={selectedUser.status}
          onProfileClick={toggleProfile}
        />
      )}

      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <Loader />
        ) : (
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              {currentPage < totalPages && (
                <div className="mb-4 flex w-full items-center justify-center">
                  <button
                    type="button"
                    onClick={incrementPage}
                    disabled={isFetching}
                    className="hover:bg-accent rounded-full border px-4 py-2 text-sm transition-colors disabled:opacity-50"
                  >
                    {isFetching ? 'Loading...' : 'Load older messages'}
                  </button>
                </div>
              )}
              {messageGroups.map((group, idx) => (
                <MessageGroupComponent
                  key={`${group.senderId}-${idx}`}
                  currentUserId={currentUserId || ''}
                  {...group}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      <MessageInput
        value={messageInput}
        onChange={setMessageInput}
        onSend={sendMessage}
      />
    </div>
  );
}

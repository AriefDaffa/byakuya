'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getChatList } from '@/features/chat/actions';
import { useChatListStore } from '@/store/chat-list-store';
import { useRealtimeConversations } from '@/hooks/use-realtime';
import type { ChatListItem } from '@/types/chat';

export function useChatList() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const requestSequenceRef = useRef(0);

  const { chatList, setChatList } = useChatListStore();

  // Fetch chat list. State is only updated after the request resolves so the
  // effect never triggers synchronous cascading renders.
  const fetchChatList = useCallback(async () => {
    const requestId = ++requestSequenceRef.current;

    try {
      const result = await getChatList();

      if (!isMountedRef.current || requestId !== requestSequenceRef.current) return;

      if (result.error) {
        setError(result.error);
      } else {
        setError(null);
        setChatList(result.data as ChatListItem[]);
      }
    } catch (cause) {
      if (!isMountedRef.current || requestId !== requestSequenceRef.current) return;
      setError(cause instanceof Error ? cause.message : 'Failed to load chats');
    } finally {
      if (isMountedRef.current && requestId === requestSequenceRef.current) {
        setIsLoading(false);
      }
    }
  }, [setChatList]);

  useEffect(() => {
    isMountedRef.current = true;
    void fetchChatList();

    return () => {
      isMountedRef.current = false;
      requestSequenceRef.current += 1;
    };
  }, [fetchChatList]);

  // Get conversation IDs for realtime updates
  const conversationIds = useMemo(
    () => chatList.map((item) => item.conversation.id),
    [chatList],
  );

  // Handle realtime conversation updates (refresh chat list)
  const handleConversationUpdate = useCallback(
    (_conversationId: string) => {
      // Re-fetch the chat list to get updated data
      void fetchChatList();
    },
    [fetchChatList],
  );

  useRealtimeConversations({
    conversationIds,
    onConversationUpdate: handleConversationUpdate,
  });

  return useMemo(
    () => ({
      data: chatList,
      isLoading,
      error,
      refetch: fetchChatList,
    }),
    [chatList, isLoading, error, fetchChatList],
  );
}

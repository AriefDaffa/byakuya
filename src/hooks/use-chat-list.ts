'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { getChatList } from '@/features/chat/actions';
import { useChatListStore } from '@/store/chat-list-store';
import { useRealtimeConversations } from '@/hooks/use-realtime';
import type { ChatListItem } from '@/types/chat';

export function useChatList() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const { chatList, setChatList } = useChatListStore();

  // Fetch chat list
  const fetchChatList = useCallback(async () => {
    setIsLoading(true);
    const result = await getChatList();

    if (!isMounted.current) return;

    if (result.error) {
      setError(result.error);
    } else {
      setChatList(result.data as ChatListItem[]);
    }
    setIsLoading(false);
  }, [setChatList]);

  useEffect(() => {
    isMounted.current = true;
    fetchChatList();
    return () => {
      isMounted.current = false;
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
      fetchChatList();
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

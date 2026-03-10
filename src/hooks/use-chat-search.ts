'use client';

import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { searchUsers, searchMessages } from '@/features/chat/actions';
import { useChatListStore } from '@/store/chat-list-store';
import type { Profile, Message } from '@/types/database';
import type { SearchResults } from '@/types/chat';

export function useChatSearch() {
  const [results, setResults] = useState<SearchResults>({
    users: [],
    messages: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { searchKeyword, setSearchKeyword } = useChatListStore();

  const performSearch = useCallback(async (keyword: string) => {
    if (keyword.length < 2) {
      setResults({ users: [], messages: [] });
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const [usersResult, messagesResult] = await Promise.all([
      searchUsers(keyword),
      searchMessages(keyword),
    ]);

    setResults({
      users: (usersResult.data || []) as Profile[],
      messages: (messagesResult.data || []) as (Message & {
        sender: Profile;
        conversation_id: string;
      })[],
    });
    setIsLoading(false);
  }, []);

  const onSearch = useCallback(
    (value: string) => {
      setSearchKeyword(value);

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      if (value === '') {
        setResults({ users: [], messages: [] });
        setIsLoading(false);
        return;
      }

      debounceTimer.current = setTimeout(() => {
        performSearch(value);
      }, 400);
    },
    [setSearchKeyword, performSearch],
  );

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return useMemo(
    () => ({
      onSearch,
      results,
      isLoading,
      searchKeyword,
    }),
    [onSearch, results, isLoading, searchKeyword],
  );
}

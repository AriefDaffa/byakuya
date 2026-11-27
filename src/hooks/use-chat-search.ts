'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const requestSequenceRef = useRef(0);

  const { searchKeyword, setSearchKeyword } = useChatListStore();

  const performSearch = useCallback(async (keyword: string) => {
    const requestId = ++requestSequenceRef.current;

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

    // Ignore responses that belong to an older query.
    if (requestId !== requestSequenceRef.current) return;

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

      // Invalidate any request that is already in flight so a slow, older
      // response cannot overwrite results for a newer query.
      requestSequenceRef.current += 1;

      if (value === '') {
        setResults({ users: [], messages: [] });
        setIsLoading(false);
        return;
      }

      debounceTimer.current = setTimeout(() => {
        void performSearch(value);
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
      requestSequenceRef.current += 1;
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

'use client';
import { searchMessages } from '@/services/searchMessages';
import { searchUser } from '@/services/searchUser';
import { useChatListStore } from '@/store/useChatListStore';
import { MergedResult } from '@/types/SearchResultTypes';
import { useDebouncedCallback } from '@mantine/hooks';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

export const useChatSearch = () => {
  const [mergedData, setMergedData] = useState<MergedResult>({
    users: [],
    messages: [],
  });

  const { searchKeyword, setSearchKeyword } = useChatListStore();

  const userMutation = useMutation({
    mutationFn: (keyword: string) => searchUser(keyword),
  });
  const msgMutation = useMutation({
    mutationFn: (keyword: string) => searchMessages(keyword),
  });

  const handleSearch = useDebouncedCallback(() => {
    userMutation.mutate(searchKeyword);
    msgMutation.mutate(searchKeyword);
  }, 500);

  const onSearch = useCallback(
    (e: string) => {
      setSearchKeyword(e);

      if (e !== '') {
        handleSearch();
        handleSearch();
      }
    },
    [handleSearch, setSearchKeyword]
  );

  useEffect(() => {
    if (userMutation.isSuccess) {
      setMergedData({
        users: userMutation.data?.data || [],
        messages: msgMutation.data?.data || [],
      });
    }
  }, [msgMutation.data?.data, userMutation.data, userMutation.isSuccess]);

  return useMemo(() => {
    return {
      onSearch,
      data: mergedData,
      isLoading: userMutation.isPending || msgMutation.isPending,
    };
  }, [onSearch, mergedData, userMutation.isPending, msgMutation.isPending]);
};

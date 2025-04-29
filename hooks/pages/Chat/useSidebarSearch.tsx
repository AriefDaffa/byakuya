import { useSearchMessages } from '@/hooks/fetch/useSearchMessages';
import { useSearchUsers } from '@/hooks/fetch/useSearchUser';
import { useDebouncedValue } from '@mantine/hooks';
import { useMemo, useState } from 'react';

export const useSidebarSearch = () => {
  const [sidebarKeyword, setSidebarKeyword] = useState('');

  const [debouncedSidebar] = useDebouncedValue(sidebarKeyword, 200);

  const { data, loading, error } = useSearchMessages(debouncedSidebar);
  const { data: userData, loading: userLoading } =
    useSearchUsers(debouncedSidebar);

  console.log({ messages: data ?? [], users: userData ?? [] });

  return useMemo(() => {
    return {
      data: { messages: data ?? [], users: userData ?? [] },
      loading: loading || userLoading,
      error,
      sidebarKeyword,
      setSidebarKeyword,
      userData,
      userLoading,
    };
  }, [data, error, loading, sidebarKeyword, userData, userLoading]);
};

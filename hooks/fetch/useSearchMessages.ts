import {
  SidebarSearchData,
  SidebarSearchResponse,
} from '@/types/SidebarSearchTypes';
import { useCallback, useEffect, useState } from 'react';

export const useSearchMessages = (keyword: string) => {
  const [data, setData] = useState<SidebarSearchData[] | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchUsers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const request = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API_URL}/v1/chat/search`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword }),
          credentials: 'include',
        }
      );

      const response: SidebarSearchResponse = await request.json();

      if (!request.ok) {
        setData(undefined);
        throw new Error(response.message || 'Something went wrong');
      }

      setData(response.data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err?.message);
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    if (!keyword || keyword.trim().length < 2) {
      return;
    }
    searchUsers();
  }, [keyword, searchUsers]);

  return { data, loading, error, searchUsers };
};

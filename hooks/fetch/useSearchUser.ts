import { UserResponse } from '@/types/UserTypes';
import { useCallback, useEffect, useState } from 'react';

export const useSearchUsers = (keyword: string) => {
  const [data, setData] = useState<UserResponse>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchUsers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const request = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_API_URL}/v1/user/search`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword }),
        }
      );

      const response: UserResponse = await request.json();

      if (!request.ok) {
        setData(response);
        throw new Error(response.message || 'Something went wrong');
      }

      setData(response);
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

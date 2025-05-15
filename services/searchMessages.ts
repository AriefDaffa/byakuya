import { SearchMessageResponse } from '@/types/SearchMessageResponse';

export const searchMessages = async (
  keyword: string
): Promise<SearchMessageResponse> => {
  return await fetch(`${process.env.NEXT_PUBLIC_BASE_API_URL}/v1/chat/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ keyword }),
    credentials: 'include',
  }).then((res) => res.json());
};

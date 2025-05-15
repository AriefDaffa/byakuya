import { SearchUserResponse } from '@/types/SearchUserResponse';

export const searchUser = async (
  keyword: string
): Promise<SearchUserResponse> => {
  return await fetch(`${process.env.NEXT_PUBLIC_BASE_API_URL}/v1/user/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ keyword }),
    credentials: 'include',
  }).then((res) => res.json());
};

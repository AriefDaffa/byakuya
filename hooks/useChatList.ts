import { useEffect, useState } from 'react';

import { ChatListType } from '@/types/ChatListTypes';

async function fetchChatList(userId: string): Promise<ChatListType[]> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_API_URL}/v1/chat-list?user_id=${userId}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-cache',
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch chat list: ${response?.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching chat list:', error);
    return [];
  }
}

export function useChatList(userId: string) {
  const [chats, setChats] = useState<ChatListType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    async function loadChats() {
      setLoading(true);
      setError(null);
      const data = await fetchChatList(userId);
      setChats(data);
      setLoading(false);
    }

    loadChats();
  }, [userId]);

  return { chats, loading, error };
}

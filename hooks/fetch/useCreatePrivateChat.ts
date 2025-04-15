import { CreateChatResponse } from '@/types/CreateUserTypes';
import { useState, useCallback } from 'react';

export type CreateChatPayload = {
  sender_id: string;
  receiver_id: string;
};

export function useCreatePrivateChat() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createChat = useCallback(
    async (payload: CreateChatPayload): Promise<CreateChatResponse> => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_API_URL}/v1/private-chat`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );

        const data: CreateChatResponse = await res.json();

        if (res.status === 409) {
          return data;
          // throw new Error('Chat already exists');
        }

        if (!res.ok) {
          throw new Error(data?.message || 'Failed to create chat');
        }

        return data;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { createChat, loading, error };
}

import { authClient } from '@/lib/auth-client';
import { useChatListStore } from '@/store/useChatListStore';
import { useEffect, useMemo } from 'react';

export const useChatList = () => {
  const { useSession } = authClient;
  const { data: session } = useSession();

  const {
    chatList,
    loading,
    fetchChatList,
    connectWebSocket,
    disconnectWebSocket,
  } = useChatListStore();

  useEffect(() => {
    if (!session?.user.id) return;
    fetchChatList(session?.user.id);
    connectWebSocket(session?.user.id);

    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket, fetchChatList, session?.user.id]);

  return useMemo(() => {
    return {
      chatList,
      loading,
    };
  }, [chatList, loading]);
};

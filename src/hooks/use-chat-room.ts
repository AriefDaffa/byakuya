'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useChatStore } from '@/store/chat-store';
import { useRealtimeMessages } from '@/hooks/use-realtime';
import {
  getMessages,
  sendMessage as sendMessageAction,
  markAsRead,
} from '@/features/chat/actions';
import type { MessageWithSender, MessageGroup } from '@/types/chat';
import type { Message } from '@/types/database';

export function useChatRoom() {
  const supabase = createClient();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const prevConversationId = useRef<string | null>(null);

  const { conversationId, messageInput, setMessageInput, page } = useChatStore();

  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, [supabase.auth]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    // Reset messages when conversation changes
    if (prevConversationId.current !== conversationId) {
      setMessages([]);
      prevConversationId.current = conversationId;
      setIsLoading(true);
    } else {
      setIsFetching(true);
    }

    getMessages(conversationId, page).then((result) => {
      if ('error' in result && result.error) {
        console.error('Failed to fetch messages:', result.error);
      } else {
        const typed = (result.data || []) as MessageWithSender[];
        if (page === 1) {
          setMessages(typed);
        } else {
          // Prepend older messages
          setMessages((prev) => [...typed, ...prev]);
        }
        setTotalPages(result.totalPages);
        setCurrentPage(result.currentPage);
      }
      setIsLoading(false);
      setIsFetching(false);
    });
  }, [conversationId, page]);

  // Mark as read when opening a conversation
  useEffect(() => {
    if (conversationId) {
      markAsRead(conversationId);
    }
  }, [conversationId]);

  // Handle realtime new messages
  const handleNewMessage = useCallback(
    (message: Message) => {
      if (message.sender_id === currentUserId) return; // Skip own messages (already added optimistically)

      // Fetch the sender profile for the new message
      supabase
        .from('profiles')
        .select('*')
        .eq('id', message.sender_id)
        .single()
        .then(({ data: sender }) => {
          if (sender) {
            const msgWithSender: MessageWithSender = {
              ...message,
              sender,
            };
            setMessages((prev) => [...prev, msgWithSender]);
          }
        });

      // Mark as read
      if (conversationId) {
        markAsRead(conversationId);
      }
    },
    [currentUserId, conversationId, supabase],
  );

  // Subscribe to realtime messages
  useRealtimeMessages({
    conversationId,
    onNewMessage: handleNewMessage,
  });

  // Send message
  const sendMessage = useCallback(async () => {
    if (!conversationId || !messageInput.trim() || !currentUserId) return;

    const content = messageInput.trim();
    setMessageInput('');

    // Optimistic update
    const optimisticMsg: MessageWithSender = {
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      sender_id: currentUserId,
      content,
      type: 'text',
      is_edited: false,
      is_deleted: false,
      reply_to_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: {
        id: currentUserId,
        name: '',
        email: '',
        avatar_url: null,
        status: 'online',
        last_seen: new Date().toISOString(),
        created_at: '',
        updated_at: '',
      },
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    // Send via server action
    const result = await sendMessageAction(conversationId, content);

    if (result.error) {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      console.error('Failed to send message:', result.error);
    } else if (result.data) {
      // Replace optimistic message with real one
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticMsg.id ? (result.data as MessageWithSender) : m,
        ),
      );
    }
  }, [conversationId, messageInput, currentUserId, setMessageInput]);

  // Group messages by sender within 1-minute windows
  const formatMessages = useCallback((msgs: MessageWithSender[]): MessageGroup[] => {
    if (!msgs.length) return [];

    const sorted = [...msgs].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

    const groups: MessageGroup[] = [];

    for (const message of sorted) {
      const lastGroup = groups[groups.length - 1];
      const messageTime = new Date(message.created_at).getTime();

      if (lastGroup && lastGroup.senderId === message.sender_id) {
        const lastMsg = lastGroup.messages[lastGroup.messages.length - 1];
        const lastTime = new Date(lastMsg.created_at).getTime();

        if (messageTime - lastTime <= 60_000) {
          lastGroup.messages.push(message);
          continue;
        }
      }

      groups.push({
        senderId: message.sender_id,
        senderName: message.sender?.name || '',
        senderAvatar: message.sender?.avatar_url || null,
        messages: [message],
      });
    }

    return groups;
  }, []);

  return useMemo(
    () => ({
      messages,
      messageGroups: formatMessages(messages),
      isLoading,
      isFetching,
      totalPages,
      currentPage,
      currentUserId,
      sendMessage,
    }),
    [
      messages,
      formatMessages,
      isLoading,
      isFetching,
      totalPages,
      currentPage,
      currentUserId,
      sendMessage,
    ],
  );
}

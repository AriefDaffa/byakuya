'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';
import type { Message } from '@/types/database';

interface UseRealtimeMessagesOptions {
  conversationId: string | null;
  onNewMessage: (message: Message) => void;
}

/**
 * Subscribe to realtime message inserts for a conversation.
 * Uses Supabase Realtime Postgres Changes.
 */
export function useRealtimeMessages({
  conversationId,
  onNewMessage,
}: UseRealtimeMessagesOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!conversationId) return;

    // Clean up previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on<Message>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          if (payload.eventType === 'INSERT') {
            onNewMessage(payload.new as Message);
          }
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, onNewMessage, supabase]);
}

interface UseRealtimeNotificationsOptions {
  userId: string | null;
  onNotification: (notification: Record<string, unknown>) => void;
}

/**
 * Subscribe to realtime notifications for a user.
 */
export function useRealtimeNotifications({
  userId,
  onNotification,
}: UseRealtimeNotificationsOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onNotification(payload.new);
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onNotification, supabase]);
}

interface UseRealtimeConversationsOptions {
  conversationIds: string[];
  onConversationUpdate: (conversationId: string) => void;
}

/**
 * Subscribe to realtime conversation updates (new messages arrival).
 */
export function useRealtimeConversations({
  conversationIds,
  onConversationUpdate,
}: UseRealtimeConversationsOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!conversationIds.length) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel('conversation-updates')
      .on<Message>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const msg = payload.new as Message;
            if (conversationIds.includes(msg.conversation_id)) {
              onConversationUpdate(msg.conversation_id);
            }
          }
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationIds, onConversationUpdate, supabase]);
}

interface UseRealtimeTypingOptions {
  conversationId: string | null;
  currentUserId: string | null;
  onTypingChange: (userId: string, isTyping: boolean) => void;
}

/**
 * Subscribe to typing indicators in a conversation.
 */
export function useRealtimeTyping({
  conversationId,
  currentUserId,
  onTypingChange,
}: UseRealtimeTypingOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!conversationId) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`typing:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const record = (payload.new || payload.old) as Record<string, string>;
          if (record && record.user_id !== currentUserId) {
            onTypingChange(
              record.user_id,
              payload.eventType === 'INSERT' || payload.eventType === 'UPDATE',
            );
          }
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, onTypingChange, supabase]);
}

/**
 * Hook to manage user online presence via Supabase Realtime Presence.
 */
export function usePresence(userId: string | null) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  const updateStatus = useCallback(
    async (status: 'online' | 'offline' | 'away') => {
      if (!userId) return;
      await supabase
        .from('profiles')
        .update({ status, last_seen: new Date().toISOString() })
        .eq('id', userId);
    },
    [userId, supabase],
  );

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel('online-users', {
      config: { presence: { key: userId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        // Can track online users here if needed
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: userId, online_at: new Date().toISOString() });
          await updateStatus('online');
        }
      });

    channelRef.current = channel;

    // Set offline on page unload
    const handleBeforeUnload = () => {
      updateStatus('offline');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      updateStatus('offline');
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, updateStatus]);
}

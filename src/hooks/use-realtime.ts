'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  REALTIME_SUBSCRIBE_STATES,
  type RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';
import type { Message } from '@/types/database';

/**
 * Keep the latest callback in a ref so realtime subscriptions can stay mounted
 * when a caller passes an inline (unstable) callback on every render.
 */
function useLatestRef<T>(value: T) {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}

function handleChannelStatus(
  channelName: string,
  status: REALTIME_SUBSCRIBE_STATES,
  error?: Error,
) {
  if (
    status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR ||
    status === REALTIME_SUBSCRIBE_STATES.TIMED_OUT
  ) {
    console.warn(
      `[realtime] Channel "${channelName}" ${status.toLowerCase()}`,
      error ?? '',
    );
  }
}

interface UseRealtimeMessagesOptions {
  conversationId: string | null;
  onNewMessage?: (message: Message) => void;
  onMessageUpdate?: (message: Message) => void;
  onMessageDelete?: (message: Message) => void;
}

/**
 * Subscribe to realtime message inserts, updates and deletes for a conversation.
 * Uses Supabase Realtime Postgres Changes.
 */
export function useRealtimeMessages({
  conversationId,
  onNewMessage,
  onMessageUpdate,
  onMessageDelete,
}: UseRealtimeMessagesOptions) {
  const supabase = createClient();
  const handlersRef = useLatestRef({
    onNewMessage,
    onMessageUpdate,
    onMessageDelete,
  });

  useEffect(() => {
    if (!conversationId) return;

    const filter = `conversation_id=eq.${conversationId}`;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on<Message>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          if (payload.eventType === 'INSERT') {
            handlersRef.current.onNewMessage?.(payload.new as Message);
          }
        },
      )
      .on<Message>(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          if (payload.eventType === 'UPDATE') {
            handlersRef.current.onMessageUpdate?.(payload.new as Message);
          }
        },
      )
      .on<Message>(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages', filter },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          if (payload.eventType === 'DELETE') {
            handlersRef.current.onMessageDelete?.(payload.old as Message);
          }
        },
      )
      .subscribe((status, error) =>
        handleChannelStatus(`messages:${conversationId}`, status, error),
      );

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, supabase, handlersRef]);
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
  const supabase = createClient();
  const handlerRef = useLatestRef(onNotification);

  useEffect(() => {
    if (!userId) return;

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
          handlerRef.current(payload.new as Record<string, unknown>);
        },
      )
      .subscribe((status, error) =>
        handleChannelStatus(`notifications:${userId}`, status, error),
      );

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, supabase, handlerRef]);
}

interface UseRealtimeConversationsOptions {
  conversationIds: string[];
  onConversationUpdate: (conversationId: string) => void;
}

/**
 * Subscribe to realtime conversation updates (new messages arrival).
 *
 * The subscription intentionally depends on whether any conversations exist
 * rather than the `conversationIds` array identity, so refreshing the chat list
 * does not tear down and recreate the channel on every update.
 */
export function useRealtimeConversations({
  conversationIds,
  onConversationUpdate,
}: UseRealtimeConversationsOptions) {
  const supabase = createClient();
  const conversationIdsRef = useRef(conversationIds);
  const callbackRef = useLatestRef(onConversationUpdate);
  const hasConversations = conversationIds.length > 0;

  useEffect(() => {
    conversationIdsRef.current = conversationIds;
  }, [conversationIds]);

  useEffect(() => {
    if (!hasConversations) return;

    const channel = supabase
      .channel('conversation-updates')
      .on<Message>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload: RealtimePostgresChangesPayload<Message>) => {
          if (payload.eventType !== 'INSERT') return;

          const message = payload.new as Message;
          if (conversationIdsRef.current.includes(message.conversation_id)) {
            callbackRef.current(message.conversation_id);
          }
        },
      )
      .subscribe((status, error) =>
        handleChannelStatus('conversation-updates', status, error),
      );

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [hasConversations, supabase, callbackRef]);
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
  const supabase = createClient();
  const handlerRef = useLatestRef(onTypingChange);

  useEffect(() => {
    if (!conversationId) return;

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
            handlerRef.current(
              record.user_id,
              payload.eventType === 'INSERT' || payload.eventType === 'UPDATE',
            );
          }
        },
      )
      .subscribe((status, error) =>
        handleChannelStatus(`typing:${conversationId}`, status, error),
      );

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, supabase, handlerRef]);
}

/**
 * Hook to manage user online presence via Supabase Realtime Presence.
 *
 * Returns the IDs of users currently tracked as online so callers can render
 * presence badges.
 */
export function usePresence(userId: string | null): string[] {
  const supabase = createClient();
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

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

    const syncOnlineUsers = () => {
      const presenceState = channel.presenceState<{ user_id?: string }>();
      const ids = new Set<string>();

      for (const presences of Object.values(presenceState)) {
        for (const presence of presences) {
          if (presence.user_id) ids.add(presence.user_id);
        }
      }

      // The local user is always considered online while subscribed.
      ids.add(userId);
      setOnlineUserIds(Array.from(ids));
    };

    channel
      .on('presence', { event: 'sync' }, syncOnlineUsers)
      .on('presence', { event: 'join' }, syncOnlineUsers)
      .on('presence', { event: 'leave' }, syncOnlineUsers)
      .subscribe(async (status) => {
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
          });
          await updateStatus('online');
        } else if (
          status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR ||
          status === REALTIME_SUBSCRIBE_STATES.TIMED_OUT
        ) {
          handleChannelStatus('online-users', status);
        }
      });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void channel.track({
          user_id: userId,
          online_at: new Date().toISOString(),
        });
        void updateStatus('online');
      } else {
        void updateStatus('away');
      }
    };

    const handleBeforeUnload = () => {
      void updateStatus('offline');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      void updateStatus('offline');
      void supabase.removeChannel(channel);
    };
  }, [userId, supabase, updateStatus]);

  return userId ? onlineUserIds : [];
}

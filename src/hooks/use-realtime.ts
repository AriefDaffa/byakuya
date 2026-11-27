'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { updateStatus } from '@/features/auth/actions';
import type { RealtimeEvent } from '@/lib/realtime/bus';
import type { MessageWithSender, ReactionSummary } from '@/types/chat';

/**
 * Client-side realtime transport.
 *
 * A single EventSource connection is shared by every hook: opening a page can
 * mount message, conversation and presence subscriptions at the same time and
 * they must not each open their own SSE stream. The browser reconnects the
 * EventSource automatically when the network drops.
 */

const REALTIME_EVENT_TYPES = [
  'message:insert',
  'message:update',
  'message:delete',
  'conversation:update',
  'presence:sync',
  'reaction:toggle',
  'message:pin',
  'typing:update',
] as const satisfies ReadonlyArray<RealtimeEvent['type']>;

type RealtimeListener = (event: RealtimeEvent) => void;

let eventSource: EventSource | null = null;
let connectionRefCount = 0;
let hasLoggedConnectionError = false;

const listeners = new Set<RealtimeListener>();

// Presence is shared state: a presence sync may arrive before a component
// subscribes, and multiple components should observe the same snapshot.
const EMPTY_ONLINE_USER_IDS: string[] = [];
let onlineUserIdsSnapshot: string[] = EMPTY_ONLINE_USER_IDS;
const presenceSubscribers = new Set<() => void>();

function setOnlineUserIds(nextOnlineUserIds: string[]): void {
  const unchanged =
    onlineUserIdsSnapshot.length === nextOnlineUserIds.length &&
    nextOnlineUserIds.every((id, index) => id === onlineUserIdsSnapshot[index]);

  if (unchanged) return;

  onlineUserIdsSnapshot = nextOnlineUserIds;

  for (const subscriber of presenceSubscribers) {
    subscriber();
  }
}

function subscribeToPresenceSnapshot(subscriber: () => void): () => void {
  presenceSubscribers.add(subscriber);

  return () => {
    presenceSubscribers.delete(subscriber);
  };
}

function getPresenceSnapshot(): string[] {
  return onlineUserIdsSnapshot;
}

function getServerPresenceSnapshot(): string[] {
  return EMPTY_ONLINE_USER_IDS;
}

function dispatchRealtimeEvent(event: RealtimeEvent): void {
  if (event.type === 'presence:sync') {
    setOnlineUserIds(event.onlineUserIds);
  }

  for (const listener of Array.from(listeners)) {
    try {
      listener(event);
    } catch (error) {
      console.error('[realtime] A subscriber threw while handling an event', error);
    }
  }
}

function connect(): void {
  if (eventSource || typeof window === 'undefined') return;

  const source = new EventSource('/api/realtime');
  eventSource = source;

  const handleMessage = (message: MessageEvent<string>) => {
    let event: RealtimeEvent;

    try {
      event = JSON.parse(message.data) as RealtimeEvent;
    } catch {
      console.warn('[realtime] Ignoring malformed event payload');
      return;
    }

    dispatchRealtimeEvent(event);
  };

  for (const type of REALTIME_EVENT_TYPES) {
    source.addEventListener(type, handleMessage as EventListener);
  }

  source.addEventListener('open', () => {
    hasLoggedConnectionError = false;
  });

  source.addEventListener('error', () => {
    if (hasLoggedConnectionError) return;

    hasLoggedConnectionError = true;
    console.warn('[realtime] SSE connection lost; the browser will retry.');
  });
}

function disconnect(): void {
  if (!eventSource) return;

  eventSource.close();
  eventSource = null;
  hasLoggedConnectionError = false;
}

/**
 * Hold the shared connection open. Reference-counted so the last hook to
 * unmount closes the stream.
 */
function acquireRealtimeConnection(): () => void {
  connectionRefCount += 1;
  connect();

  let released = false;

  return () => {
    if (released) return;
    released = true;

    connectionRefCount = Math.max(0, connectionRefCount - 1);

    if (connectionRefCount === 0) {
      disconnect();
    }
  };
}

function subscribeRealtimeEvents(listener: RealtimeListener): () => void {
  listeners.add(listener);
  const releaseConnection = acquireRealtimeConnection();

  return () => {
    listeners.delete(listener);
    releaseConnection();
  };
}

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

function persistPresenceStatus(status: 'online' | 'offline' | 'away'): void {
  void Promise.resolve(updateStatus(status)).catch((error: unknown) => {
    console.error('[realtime] Failed to update profile status', error);
  });
}

interface UseRealtimeMessagesOptions {
  conversationId: string | null;
  onNewMessage?: (message: MessageWithSender) => void;
  onMessageUpdate?: (message: MessageWithSender) => void;
  onMessageDelete?: (messageId: string) => void;
  onReactionToggle?: (messageId: string, reactions: ReactionSummary[]) => void;
  onMessagePin?: (
    messageId: string,
    isPinned: boolean,
    pinnedAt: string | null,
    pinnedBy: string | null,
  ) => void;
}

/**
 * Subscribe to realtime message inserts, updates, deletes, reactions, and pins
 * for a conversation.
 */
export function useRealtimeMessages({
  conversationId,
  onNewMessage,
  onMessageUpdate,
  onMessageDelete,
  onReactionToggle,
  onMessagePin,
}: UseRealtimeMessagesOptions) {
  const handlersRef = useLatestRef({
    onNewMessage,
    onMessageUpdate,
    onMessageDelete,
    onReactionToggle,
    onMessagePin,
  });

  useEffect(() => {
    if (!conversationId) return;

    return subscribeRealtimeEvents((event) => {
      if (event.type === 'message:insert') {
        if (event.conversationId === conversationId) {
          handlersRef.current.onNewMessage?.(event.message);
        }
        return;
      }

      if (event.type === 'message:update') {
        if (event.conversationId === conversationId) {
          handlersRef.current.onMessageUpdate?.(event.message);
        }
        return;
      }

      if (event.type === 'message:delete') {
        if (event.conversationId === conversationId) {
          handlersRef.current.onMessageDelete?.(event.messageId);
        }
        return;
      }

      if (event.type === 'reaction:toggle') {
        if (event.conversationId === conversationId) {
          handlersRef.current.onReactionToggle?.(event.messageId, event.reactions);
        }
        return;
      }

      if (event.type === 'message:pin') {
        if (event.conversationId === conversationId) {
          handlersRef.current.onMessagePin?.(
            event.messageId,
            event.isPinned,
            event.pinnedAt,
            event.pinnedBy,
          );
        }
      }
    });
  }, [conversationId, handlersRef]);
}

interface UseRealtimeConversationsOptions {
  conversationIds: string[];
  onConversationUpdate: (conversationId: string) => void;
}

/**
 * Subscribe to realtime conversation activity.
 *
 * The subscription intentionally depends on whether any conversations exist
 * rather than the `conversationIds` array identity, so refreshing the chat list
 * does not tear down and recreate the subscription on every update.
 */
export function useRealtimeConversations({
  conversationIds: _conversationIds,
  onConversationUpdate,
}: UseRealtimeConversationsOptions) {
  const callbackRef = useLatestRef(onConversationUpdate);

  useEffect(() => {
    return subscribeRealtimeEvents((event) => {
      if (
        event.type === 'message:insert' ||
        event.type === 'message:update' ||
        event.type === 'message:delete' ||
        event.type === 'conversation:update'
      ) {
        callbackRef.current(event.conversationId);
      }
    });
  }, [callbackRef]);
}

/**
 * Track which users currently have at least one live SSE connection.
 *
 * Returns the IDs of online users so callers can render presence badges.
 */
export function usePresence(userId: string | null): string[] {
  const onlineUserIds = useSyncExternalStore(
    subscribeToPresenceSnapshot,
    getPresenceSnapshot,
    getServerPresenceSnapshot,
  );

  // Presence is delivered by the shared SSE connection even when no other
  // realtime hook is mounted, so hold a reference for the hook's lifetime.
  useEffect(() => {
    if (!userId) return;

    return acquireRealtimeConnection();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    persistPresenceStatus('online');

    const handleVisibilityChange = () => {
      persistPresenceStatus(document.visibilityState === 'visible' ? 'online' : 'away');
    };

    const handleBeforeUnload = () => {
      persistPresenceStatus('offline');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      persistPresenceStatus('offline');
    };
  }, [userId]);

  return userId ? onlineUserIds : EMPTY_ONLINE_USER_IDS;
}

const TYPING_TIMEOUT_MS = 3500;

/**
 * Track active typers in a conversation and provide a throttled sender.
 */
export function useTypingIndicator(
  conversationId: string | null,
  currentUserId: string | null,
) {
  const [typers, setTypers] = useState<
    Array<{ conversationId: string; userId: string; userName: string }>
  >([]);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const lastSentRef = useRef<number>(0);

  useEffect(() => {
    const activeTimeouts = timeoutsRef.current;

    if (!conversationId) return;

    const unsubscribe = subscribeRealtimeEvents((event) => {
      if (event.type !== 'typing:update') return;
      if (event.conversationId !== conversationId) return;
      if (event.userId === currentUserId) return;

      const existingTimer = activeTimeouts.get(event.userId);
      if (existingTimer) {
        clearTimeout(existingTimer);
        activeTimeouts.delete(event.userId);
      }

      if (!event.isTyping) {
        setTypers((prev) =>
          prev.filter(
            (t) => !(t.conversationId === conversationId && t.userId === event.userId),
          ),
        );
        return;
      }

      setTypers((prev) => {
        if (
          prev.some(
            (t) => t.conversationId === conversationId && t.userId === event.userId,
          )
        ) {
          return prev;
        }
        return [
          ...prev,
          { conversationId, userId: event.userId, userName: event.userName },
        ];
      });

      const timer = setTimeout(() => {
        activeTimeouts.delete(event.userId);
        setTypers((prev) =>
          prev.filter(
            (t) => !(t.conversationId === conversationId && t.userId === event.userId),
          ),
        );
      }, TYPING_TIMEOUT_MS);

      activeTimeouts.set(event.userId, timer);
    });

    return () => {
      unsubscribe();
      for (const timer of activeTimeouts.values()) {
        clearTimeout(timer);
      }
      activeTimeouts.clear();
    };
  }, [conversationId, currentUserId]);

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!conversationId) return;
      const now = Date.now();
      if (isTyping && now - lastSentRef.current < 1500) return;
      lastSentRef.current = isTyping ? now : 0;

      void fetch('/api/realtime/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, isTyping }),
      }).catch(() => {});
    },
    [conversationId],
  );

  const typingUsers = conversationId
    ? typers.filter((t) => t.conversationId === conversationId)
    : [];

  return { typingUsers, sendTyping };
}

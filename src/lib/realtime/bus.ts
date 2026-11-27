import { EventEmitter } from 'node:events';
import type { MessageWithSender, ReactionSummary } from '@/types/chat';

/**
 * Server-side realtime event bus.
 *
 * The chat application used to rely on Supabase Realtime, but the migrated
 * stack talks to PostgreSQL directly. This module is the in-process fan-out
 * point between server code that mutates chat data (for example the chat
 * server actions) and the SSE endpoint that streams events to browsers.
 */

export type RealtimeEvent =
  | {
      type: 'message:insert';
      conversationId: string;
      message: MessageWithSender;
    }
  | {
      type: 'message:update';
      conversationId: string;
      message: MessageWithSender;
    }
  | {
      type: 'message:delete';
      conversationId: string;
      messageId: string;
    }
  | {
      type: 'conversation:update';
      conversationId: string;
      participantIds: string[];
    }
  | {
      type: 'presence:sync';
      onlineUserIds: string[];
    }
  | {
      type: 'reaction:toggle';
      conversationId: string;
      messageId: string;
      reactions: ReactionSummary[];
    }
  | {
      type: 'message:pin';
      conversationId: string;
      messageId: string;
      isPinned: boolean;
      pinnedAt: string | null;
      pinnedBy: string | null;
    }
  | {
      type: 'typing:update';
      conversationId: string;
      userId: string;
      userName: string;
      isTyping: boolean;
    };

export type RealtimeListener = (event: RealtimeEvent) => void;

interface RealtimeBusState {
  emitter: EventEmitter;
  onlineUsers: Set<string>;
  /**
   * Number of live SSE connections per user. A plain Set is not enough here:
   * opening the app in two tabs and closing one must not mark the user
   * offline while the other tab is still connected.
   */
  connectionCounts: Map<string, number>;
}

const REALTIME_EVENT = 'realtime';

declare global {
  // Reuse the bus across dev hot reloads and route module re-evaluations.
  var __byakuyaRealtimeBus: RealtimeBusState | undefined;
}

function getBusState(): RealtimeBusState {
  if (!globalThis.__byakuyaRealtimeBus) {
    const emitter = new EventEmitter();
    // Each browser tab holds one SSE connection, so the listener count can
    // grow well past Node's default warning threshold. There is no useful
    // upper bound to enforce.
    emitter.setMaxListeners(0);

    globalThis.__byakuyaRealtimeBus = {
      emitter,
      onlineUsers: new Set(),
      connectionCounts: new Map(),
    };
  }

  return globalThis.__byakuyaRealtimeBus;
}

/** Broadcast an event to every subscribed SSE connection. */
export function publishRealtimeEvent(event: RealtimeEvent): void {
  getBusState().emitter.emit(REALTIME_EVENT, event);
}

/**
 * Subscribe to realtime events.
 *
 * @returns An unsubscribe function.
 */
export function subscribeRealtime(listener: RealtimeListener): () => void {
  const { emitter } = getBusState();

  emitter.on(REALTIME_EVENT, listener);

  return () => {
    emitter.off(REALTIME_EVENT, listener);
  };
}

/** Mark one more connection for a user as online. */
export function registerPresence(userId: string): void {
  const { onlineUsers, connectionCounts } = getBusState();

  connectionCounts.set(userId, (connectionCounts.get(userId) ?? 0) + 1);
  onlineUsers.add(userId);
}

/** Mark one connection for a user as closed. */
export function unregisterPresence(userId: string): void {
  const { onlineUsers, connectionCounts } = getBusState();
  const connectionCount = connectionCounts.get(userId);

  if (connectionCount === undefined) return;

  if (connectionCount <= 1) {
    connectionCounts.delete(userId);
    onlineUsers.delete(userId);
  } else {
    connectionCounts.set(userId, connectionCount - 1);
  }
}

/** IDs of users with at least one live SSE connection. */
export function getOnlineUserIds(): string[] {
  return Array.from(getBusState().onlineUsers);
}

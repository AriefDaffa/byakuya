import { getCurrentUser } from '@/lib/auth/session';
import { query } from '@/lib/db/pool';
import {
  getOnlineUserIds,
  publishRealtimeEvent,
  registerPresence,
  subscribeRealtime,
  unregisterPresence,
  type RealtimeEvent,
} from '@/lib/realtime/bus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const KEEPALIVE_INTERVAL_MS = 25_000;

interface ConversationMembershipRow {
  user_id: string;
}

/**
 * The pool helper may expose either raw rows or a `pg` QueryResult depending
 * on how it is wrapped. Accept both so this endpoint stays coupled only to the
 * documented `query(text, params)` signature.
 */
function extractRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];

  if (
    result !== null &&
    typeof result === 'object' &&
    Array.isArray((result as { rows?: unknown }).rows)
  ) {
    return (result as { rows: T[] }).rows;
  }

  return [];
}

async function isConversationMember(
  conversationId: string,
  userId: string,
): Promise<boolean> {
  try {
    const result = await query<ConversationMembershipRow>(
      `SELECT user_id
         FROM public.conversation_members
        WHERE conversation_id = $1
          AND user_id = $2
        LIMIT 1`,
      [conversationId, userId],
    );

    return extractRows<ConversationMembershipRow>(result).length > 0;
  } catch (error) {
    console.error('[realtime] Failed to verify conversation membership', error);
    return false;
  }
}

export async function GET(request: Request): Promise<Response> {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = currentUser.id;
  const encoder = new TextEncoder();

  // Assigned from inside start() so the stream's cancel() callback can tear
  // down the same resources.
  let stopStream: (() => void) | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let keepAliveTimer: ReturnType<typeof setInterval> | null = null;
      let unsubscribe: (() => void) | null = null;
      let deliveryChain: Promise<void> = Promise.resolve();

      // Membership is stable for the lifetime of most connections, so cache
      // the answer per conversation and de-duplicate concurrent checks.
      const conversationAccess = new Map<string, boolean>();
      const pendingMembershipChecks = new Map<string, Promise<boolean>>();

      function sendEvent(event: RealtimeEvent): void {
        if (closed) return;

        try {
          controller.enqueue(
            encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`),
          );
        } catch {
          // The consumer went away between the abort check and the write.
          stop(controller, false);
        }
      }

      function canAccessConversation(conversationId: string): Promise<boolean> {
        const cached = conversationAccess.get(conversationId);
        if (cached !== undefined) return Promise.resolve(cached);

        const pending = pendingMembershipChecks.get(conversationId);
        if (pending) return pending;

        const request = isConversationMember(conversationId, userId)
          .then((allowed) => {
            conversationAccess.set(conversationId, allowed);
            return allowed;
          })
          .finally(() => {
            pendingMembershipChecks.delete(conversationId);
          });

        pendingMembershipChecks.set(conversationId, request);
        return request;
      }

      async function forwardEvent(event: RealtimeEvent): Promise<void> {
        if (closed) return;

        if (event.type === 'presence:sync') {
          sendEvent(event);
          return;
        }

        if (event.type === 'conversation:update') {
          // The participant list is authoritative for this event and also
          // refreshes the cache for subsequent message events. Fall back to a
          // database check if a publisher omits it.
          const allowed = event.participantIds
            ? event.participantIds.includes(userId)
            : await canAccessConversation(event.conversationId);

          conversationAccess.set(event.conversationId, allowed);

          if (allowed) sendEvent(event);
          return;
        }

        if (await canAccessConversation(event.conversationId)) {
          sendEvent(event);
        }
      }

      function handleAbort(): void {
        stop(controller, true);
      }

      function stop(target: ReadableStreamDefaultController<Uint8Array>, close: boolean) {
        if (closed) return;
        closed = true;

        if (keepAliveTimer) {
          clearInterval(keepAliveTimer);
          keepAliveTimer = null;
        }

        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }

        request.signal.removeEventListener('abort', handleAbort);

        unregisterPresence(userId);
        publishRealtimeEvent({
          type: 'presence:sync',
          onlineUserIds: getOnlineUserIds(),
        });

        if (close) {
          try {
            target.close();
          } catch {
            // Already closed by the runtime.
          }
        }
      }

      stopStream = () => stop(controller, false);

      if (request.signal.aborted) {
        stop(controller, true);
        return;
      }

      // Serialize delivery so membership lookups cannot reorder events.
      unsubscribe = subscribeRealtime((event) => {
        deliveryChain = deliveryChain
          .then(() => forwardEvent(event))
          .catch((error: unknown) => {
            console.error('[realtime] Failed to deliver event', error);
          });
      });

      request.signal.addEventListener('abort', handleAbort);

      registerPresence(userId);
      // Notifies every connection (including this one) that the presence
      // roster changed.
      publishRealtimeEvent({
        type: 'presence:sync',
        onlineUserIds: getOnlineUserIds(),
      });

      keepAliveTimer = setInterval(() => {
        if (closed) return;

        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          stop(controller, false);
        }
      }, KEEPALIVE_INTERVAL_MS);
    },
    cancel() {
      stopStream?.();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

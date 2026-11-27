import { getCurrentUser } from '@/lib/auth/session';
import { ensureConversationMember } from '@/features/chat/queries';
import { conversationIdSchema } from '@/features/chat/schemas';
import { publishRealtimeEvent } from '@/lib/realtime/bus';
import { z } from 'zod';

const typingPayloadSchema = z.object({
  conversationId: conversationIdSchema,
  isTyping: z.boolean(),
});

export async function POST(request: Request): Promise<Response> {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return new Response('Unauthorized', { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const parsed = typingPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return new Response('Invalid payload', { status: 400 });
  }

  const membershipError = await ensureConversationMember(
    parsed.data.conversationId,
    currentUser.id,
  );
  if (membershipError) {
    return new Response(membershipError, { status: 403 });
  }

  publishRealtimeEvent({
    type: 'typing:update',
    conversationId: parsed.data.conversationId,
    userId: currentUser.id,
    userName: currentUser.name,
    isTyping: parsed.data.isTyping,
  });

  return new Response(null, { status: 204 });
}

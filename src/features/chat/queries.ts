import { query } from '@/lib/db/pool';
import type { ChatListItem, MessageWithSender } from '@/types/chat';
import type { Attachment, Conversation, Message, Profile } from '@/types/database';

export interface MessageOwnershipRow {
  id: string;
  conversation_id: string;
  sender_id: string;
}

interface ChatListRow {
  id: string;
  type: Conversation['type'];
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  other_user: Profile | null;
  last_message: Message | null;
  unread_count: number | string | null;
}

/**
 * Public profile projection. Password hashes must never leave the database,
 * so every query that returns a user builds an explicit JSON object.
 */
const PROFILE_JSON = `jsonb_build_object(
  'id', u.id,
  'name', u.name,
  'email', u.email,
  'avatar_url', u.avatar_url,
  'status', u.status,
  'last_seen', u.last_seen,
  'created_at', u.created_at,
  'updated_at', u.updated_at
)`;

const ATTACHMENTS_JSON = `COALESCE((
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', a.id,
      'message_id', a.message_id,
      'file_name', a.file_name,
      'file_type', a.file_type,
      'file_size', a.file_size,
      'file_url', a.file_url,
      'storage_path', a.storage_path,
      'created_at', a.created_at
    )
    ORDER BY a.created_at, a.id
  )
  FROM public.attachments a
  WHERE a.message_id = m.id
), '[]'::jsonb)`;

const MESSAGE_COLUMNS = `
  m.id,
  m.conversation_id,
  m.sender_id,
  m.content,
  m.type,
  m.is_edited,
  m.is_deleted,
  m.reply_to_id,
  m.created_at,
  m.updated_at,
  ${PROFILE_JSON} AS sender,
  ${ATTACHMENTS_JSON} AS attachments
`;

/**
 * Verify the current user belongs to a conversation. Returns an error message
 * when the membership cannot be confirmed, otherwise `null`.
 */
export async function ensureConversationMember(
  conversationId: string,
  userId: string,
): Promise<string | null> {
  const result = await query<{ is_member: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM public.conversation_members
       WHERE conversation_id = $1 AND user_id = $2
     ) AS is_member`,
    [conversationId, userId],
  );

  return result.rows[0]?.is_member ? null : 'You are not a member of this conversation';
}

/**
 * Load a message and ensure the current user owns it. Ownership updates should
 * always go through this guard instead of relying on the update filter alone.
 */
export async function getOwnedMessage(
  messageId: string,
  userId: string,
): Promise<{ message?: MessageOwnershipRow; error?: string }> {
  const result = await query<MessageOwnershipRow>(
    `SELECT id, conversation_id, sender_id
     FROM public.messages
     WHERE id = $1`,
    [messageId],
  );

  const message = result.rows[0];
  if (!message) return { error: 'Message not found' };
  if (message.sender_id !== userId) {
    return { error: 'You can only modify your own messages' };
  }

  const membershipError = await ensureConversationMember(message.conversation_id, userId);
  if (membershipError) return { error: membershipError };

  return { message };
}

/**
 * Build the chat list in a single query: conversation, other participant,
 * latest visible message and unread count are all aggregated in Postgres.
 */
export async function fetchChatList(userId: string): Promise<ChatListItem[]> {
  const result = await query<ChatListRow>(
    `WITH my_memberships AS (
       SELECT
         cm.conversation_id,
         COALESCE(cm.last_read_at, cm.joined_at) AS last_read_at
       FROM public.conversation_members cm
       WHERE cm.user_id = $1
     )
     SELECT
       c.id,
       c.type,
       c.name,
       c.avatar_url,
       c.created_at,
       c.updated_at,
       (
         SELECT jsonb_build_object(
           'id', u.id,
           'name', u.name,
           'email', u.email,
           'avatar_url', u.avatar_url,
           'status', u.status,
           'last_seen', u.last_seen,
           'created_at', u.created_at,
           'updated_at', u.updated_at
         )
         FROM public.conversation_members other_members
         JOIN public.users u ON u.id = other_members.user_id
         WHERE other_members.conversation_id = c.id
           AND other_members.user_id <> $1
         ORDER BY other_members.joined_at, other_members.id
         LIMIT 1
       ) AS other_user,
       (
         SELECT to_jsonb(recent)
         FROM (
           SELECT
             msg.id,
             msg.conversation_id,
             msg.sender_id,
             msg.content,
             msg.type,
             msg.is_edited,
             msg.is_deleted,
             msg.reply_to_id,
             msg.created_at,
             msg.updated_at
           FROM public.messages msg
           WHERE msg.conversation_id = c.id
             AND msg.is_deleted = FALSE
           ORDER BY msg.created_at DESC, msg.id DESC
           LIMIT 1
         ) recent
       ) AS last_message,
       (
         SELECT COUNT(*)::int
         FROM public.messages msg
         WHERE msg.conversation_id = c.id
           AND msg.is_deleted = FALSE
           AND msg.sender_id <> $1
           AND msg.created_at > my_memberships.last_read_at
       ) AS unread_count
     FROM public.conversations c
     JOIN my_memberships ON my_memberships.conversation_id = c.id
     ORDER BY c.updated_at DESC, c.id DESC`,
    [userId],
  );

  return result.rows.map((row) => ({
    conversation: {
      id: row.id,
      type: row.type,
      name: row.name,
      avatar_url: row.avatar_url,
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
    otherUser: row.other_user,
    lastMessage: row.last_message,
    unreadCount: Number(row.unread_count ?? 0),
  }));
}

/** Conversation ids for realtime fan-out. */
export async function getConversationParticipantIds(
  conversationId: string,
): Promise<string[]> {
  const result = await query<{ user_id: string }>(
    `SELECT user_id
     FROM public.conversation_members
     WHERE conversation_id = $1
     ORDER BY joined_at, id`,
    [conversationId],
  );

  return result.rows.map((row) => row.user_id);
}

/** A single message with its sender and attachments. */
export async function getMessageWithSender(
  messageId: string,
): Promise<MessageWithSender | null> {
  const result = await query<MessageWithSender>(
    `SELECT ${MESSAGE_COLUMNS}
     FROM public.messages m
     JOIN public.users u ON u.id = m.sender_id
     WHERE m.id = $1`,
    [messageId],
  );

  return result.rows[0] ?? null;
}

/** One page of visible messages, newest first. */
export async function fetchMessagesPage(
  conversationId: string,
  limit: number,
  offset: number,
): Promise<MessageWithSender[]> {
  const result = await query<MessageWithSender>(
    `SELECT ${MESSAGE_COLUMNS}
     FROM public.messages m
     JOIN public.users u ON u.id = m.sender_id
     WHERE m.conversation_id = $1
       AND m.is_deleted = FALSE
     ORDER BY m.created_at DESC, m.id DESC
     LIMIT $2 OFFSET $3`,
    [conversationId, limit, offset],
  );

  return result.rows;
}

/** Total number of visible messages in a conversation. */
export async function countConversationMessages(conversationId: string): Promise<number> {
  const result = await query<{ count: number | string }>(
    `SELECT COUNT(*)::int AS count
     FROM public.messages
     WHERE conversation_id = $1
       AND is_deleted = FALSE`,
    [conversationId],
  );

  return Number(result.rows[0]?.count ?? 0);
}

/** Insert a message and return it with its sender (attachments start empty). */
export async function insertMessage(params: {
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
}): Promise<MessageWithSender> {
  const result = await query<MessageWithSender>(
    `WITH m AS (
       INSERT INTO public.messages (conversation_id, sender_id, content, type)
       VALUES ($1, $2, $3, $4)
       RETURNING *
     )
     SELECT ${MESSAGE_COLUMNS}
     FROM m
     JOIN public.users u ON u.id = m.sender_id`,
    [params.conversationId, params.senderId, params.content, params.type],
  );

  const message = result.rows[0];
  if (!message) throw new Error('Failed to create message');
  return message;
}

/** Update message content and return the refreshed row. */
export async function updateMessageContent(params: {
  messageId: string;
  senderId: string;
  content: string;
}): Promise<MessageWithSender | null> {
  const result = await query<MessageWithSender>(
    `WITH m AS (
       UPDATE public.messages
       SET content = $3, is_edited = TRUE, updated_at = NOW()
       WHERE id = $1 AND sender_id = $2 AND is_deleted = FALSE
       RETURNING *
     )
     SELECT ${MESSAGE_COLUMNS}
     FROM m
     JOIN public.users u ON u.id = m.sender_id`,
    [params.messageId, params.senderId, params.content],
  );

  return result.rows[0] ?? null;
}

/** Soft-delete a message. */
export async function softDeleteMessage(params: {
  messageId: string;
  senderId: string;
}): Promise<void> {
  await query(
    `UPDATE public.messages
     SET is_deleted = TRUE, content = NULL, updated_at = NOW()
     WHERE id = $1 AND sender_id = $2`,
    [params.messageId, params.senderId],
  );
}

/** Remove a message row. Used to roll back a failed attachment insert. */
export async function deleteMessageRow(messageId: string): Promise<void> {
  await query(`DELETE FROM public.messages WHERE id = $1`, [messageId]);
}

/** Insert an attachment row. */
export async function insertAttachment(params: {
  id: string;
  messageId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  storagePath: string;
}): Promise<Attachment> {
  const result = await query<Attachment>(
    `INSERT INTO public.attachments (
       id, message_id, file_name, file_type, file_size, file_url, storage_path
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      params.id,
      params.messageId,
      params.fileName,
      params.fileType,
      params.fileSize,
      params.fileUrl,
      params.storagePath,
    ],
  );

  const attachment = result.rows[0];
  if (!attachment) throw new Error('Failed to create attachment');
  return attachment;
}

/** Create (or reuse) the single private conversation between two users. */
export async function getOrCreatePrivateConversation(
  userId: string,
  otherUserId: string,
): Promise<string> {
  const result = await query<{ conversation_id: string }>(
    `SELECT public.get_or_create_private_conversation($1, $2) AS conversation_id`,
    [userId, otherUserId],
  );

  const conversationId = result.rows[0]?.conversation_id;
  if (!conversationId) throw new Error('Failed to create conversation');
  return conversationId;
}

/** Update the current user's read marker. */
export async function markConversationRead(
  conversationId: string,
  userId: string,
): Promise<void> {
  await query(
    `UPDATE public.conversation_members
     SET last_read_at = NOW()
     WHERE conversation_id = $1 AND user_id = $2`,
    [conversationId, userId],
  );
}

/** Search users by name or email, excluding the current user. */
export async function searchUsersByTerm(
  userId: string,
  pattern: string,
): Promise<Profile[]> {
  const result = await query<Profile>(
    `SELECT
       u.id,
       u.name,
       u.email,
       u.avatar_url,
       u.status,
       u.last_seen,
       u.created_at,
       u.updated_at
     FROM public.users u
     WHERE u.id <> $1
       AND (u.name ILIKE $2 OR u.email ILIKE $2)
     ORDER BY u.name ASC, u.id ASC
     LIMIT 20`,
    [userId, pattern],
  );

  return result.rows;
}

/** Search visible messages in conversations the user belongs to. */
export async function searchMessagesByTerm(
  userId: string,
  pattern: string,
): Promise<MessageWithSender[]> {
  const result = await query<MessageWithSender>(
    `SELECT ${MESSAGE_COLUMNS}
     FROM public.messages m
     JOIN public.users u ON u.id = m.sender_id
     WHERE m.is_deleted = FALSE
       AND m.content ILIKE $2
       AND m.conversation_id IN (
         SELECT cm.conversation_id
         FROM public.conversation_members cm
         WHERE cm.user_id = $1
       )
     ORDER BY m.created_at DESC, m.id DESC
     LIMIT 20`,
    [userId, pattern],
  );

  return result.rows;
}

'use server';

import { getCurrentUser } from '@/lib/auth/session';
import { publishRealtimeEvent } from '@/lib/realtime/bus';
import type { Attachment, Profile } from '@/types/database';
import type { MessageWithSender } from '@/types/chat';
import {
  createAttachmentStoragePath,
  deleteLocalAttachment,
  getAttachmentUrl,
  saveLocalAttachment,
} from './attachments';
import {
  countConversationMessages,
  deleteMessageRow,
  ensureConversationMember,
  fetchChatList,
  fetchMessagesPage,
  getConversationParticipantIds,
  getOrCreatePrivateConversation,
  getOwnedMessage,
  insertAttachment,
  insertMessage,
  markConversationRead,
  searchMessagesByTerm,
  searchUsersByTerm,
  softDeleteMessage,
  updateMessageContent,
} from './queries';
import {
  MAX_MESSAGE_LENGTH,
  attachmentFileSchema,
  conversationIdSchema,
  firstZodError,
  getPagination,
  messageContentSchema,
  messageIdSchema,
  sanitizeSearchTerm,
  searchKeywordSchema,
  toIlikePattern,
  userIdSchema,
} from './schemas';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong';
}

function resolvePattern(keyword: string): string | null {
  const parsedKeyword = searchKeywordSchema.safeParse(keyword);
  if (!parsedKeyword.success) return null;

  const term = sanitizeSearchTerm(parsedKeyword.data);
  if (term.length < 2) return null;

  return toIlikePattern(term);
}

async function loadUser(): Promise<Profile | null> {
  try {
    return await getCurrentUser();
  } catch {
    return null;
  }
}

/** Send a text message in a conversation */
export async function sendMessage(conversationId: string, content: string) {
  const user = await loadUser();
  if (!user) return { error: 'Not authenticated' };

  const parsedConversationId = conversationIdSchema.safeParse(conversationId);
  if (!parsedConversationId.success) {
    return { error: firstZodError(parsedConversationId.error) };
  }

  const parsedContent = messageContentSchema.safeParse(content);
  if (!parsedContent.success) {
    return { error: firstZodError(parsedContent.error) };
  }

  try {
    const membershipError = await ensureConversationMember(
      parsedConversationId.data,
      user.id,
    );
    if (membershipError) return { error: membershipError };

    const message = await insertMessage({
      conversationId: parsedConversationId.data,
      senderId: user.id,
      content: parsedContent.data,
      type: 'text',
    });

    await publishRealtimeEvent({
      type: 'message:insert',
      conversationId: message.conversation_id,
      message,
    });

    return { data: message };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

/** Send a message with a locally stored file attachment */
export async function sendAttachment(
  conversationId: string,
  formData: FormData,
  caption?: string,
) {
  const user = await loadUser();
  if (!user) return { error: 'Not authenticated' };

  const parsedConversationId = conversationIdSchema.safeParse(conversationId);
  if (!parsedConversationId.success) {
    return { error: firstZodError(parsedConversationId.error) };
  }

  const parsedFile = attachmentFileSchema.safeParse(formData.get('file'));
  if (!parsedFile.success) {
    return { error: firstZodError(parsedFile.error) };
  }

  let content = parsedFile.data.name.trim() || 'Attachment';
  if (caption !== undefined && caption.trim() !== '') {
    const parsedCaption = messageContentSchema.safeParse(caption);
    if (!parsedCaption.success) {
      return { error: firstZodError(parsedCaption.error) };
    }
    content = parsedCaption.data;
  }
  content = content.slice(0, MAX_MESSAGE_LENGTH);

  const membershipError = await ensureConversationMember(
    parsedConversationId.data,
    user.id,
  );
  if (membershipError) return { error: membershipError };

  const file = parsedFile.data;
  const storagePath = createAttachmentStoragePath(
    parsedConversationId.data,
    file.name,
    file.type,
  );

  try {
    await saveLocalAttachment(storagePath, Buffer.from(await file.arrayBuffer()));
  } catch (error) {
    return { error: getErrorMessage(error) };
  }

  const messageType = file.type.startsWith('image/') ? 'image' : 'file';

  let message: MessageWithSender;
  try {
    message = await insertMessage({
      conversationId: parsedConversationId.data,
      senderId: user.id,
      content,
      type: messageType,
    });
  } catch (error) {
    await deleteLocalAttachment(storagePath).catch(() => undefined);
    return { error: getErrorMessage(error) };
  }

  const attachmentId = crypto.randomUUID();
  let attachment: Attachment;
  try {
    attachment = await insertAttachment({
      id: attachmentId,
      messageId: message.id,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileUrl: getAttachmentUrl(attachmentId),
      storagePath,
    });
  } catch (error) {
    await deleteMessageRow(message.id).catch(() => undefined);
    await deleteLocalAttachment(storagePath).catch(() => undefined);
    return { error: getErrorMessage(error) };
  }

  const messageWithAttachment: MessageWithSender = {
    ...message,
    attachments: [attachment],
  };

  try {
    await publishRealtimeEvent({
      type: 'message:insert',
      conversationId: message.conversation_id,
      message: messageWithAttachment,
    });
  } catch {
    // The message is already persisted; a realtime hiccup must not fail it.
  }

  return { data: messageWithAttachment };
}

/** Edit a message (only own messages) */
export async function editMessage(messageId: string, newContent: string) {
  const user = await loadUser();
  if (!user) return { error: 'Not authenticated' };

  const parsedMessageId = messageIdSchema.safeParse(messageId);
  if (!parsedMessageId.success) {
    return { error: firstZodError(parsedMessageId.error) };
  }

  const parsedContent = messageContentSchema.safeParse(newContent);
  if (!parsedContent.success) {
    return { error: firstZodError(parsedContent.error) };
  }

  try {
    const ownedMessage = await getOwnedMessage(parsedMessageId.data, user.id);
    if (ownedMessage.error) return { error: ownedMessage.error };

    const message = await updateMessageContent({
      messageId: parsedMessageId.data,
      senderId: user.id,
      content: parsedContent.data,
    });
    if (!message) return { error: 'Message not found' };

    await publishRealtimeEvent({
      type: 'message:update',
      conversationId: message.conversation_id,
      message,
    });

    return { data: message };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

/** Soft-delete a message (only own messages) */
export async function deleteMessage(messageId: string) {
  const user = await loadUser();
  if (!user) return { error: 'Not authenticated' };

  const parsedMessageId = messageIdSchema.safeParse(messageId);
  if (!parsedMessageId.success) {
    return { error: firstZodError(parsedMessageId.error) };
  }

  try {
    const ownedMessage = await getOwnedMessage(parsedMessageId.data, user.id);
    if (ownedMessage.error) return { error: ownedMessage.error };

    const conversationId = ownedMessage.message?.conversation_id;
    if (!conversationId) return { error: 'Message not found' };

    await softDeleteMessage({
      messageId: parsedMessageId.data,
      senderId: user.id,
    });

    await publishRealtimeEvent({
      type: 'message:delete',
      conversationId,
      messageId: parsedMessageId.data,
    });

    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

/** Get paginated messages for a conversation */
export async function getMessages(conversationId: string, page: number = 1) {
  const pagination = getPagination(page);

  const user = await loadUser();
  if (!user) {
    return {
      error: 'Not authenticated',
      data: [],
      totalPages: 0,
      currentPage: 1,
    };
  }

  const parsedConversationId = conversationIdSchema.safeParse(conversationId);
  if (!parsedConversationId.success) {
    return {
      error: firstZodError(parsedConversationId.error),
      data: [],
      totalPages: 0,
      currentPage: 1,
    };
  }

  try {
    const membershipError = await ensureConversationMember(
      parsedConversationId.data,
      user.id,
    );
    if (membershipError) {
      return {
        error: membershipError,
        data: [],
        totalPages: 0,
        currentPage: pagination.page,
      };
    }

    const [rows, totalMessages] = await Promise.all([
      fetchMessagesPage(parsedConversationId.data, pagination.limit, pagination.offset),
      countConversationMessages(parsedConversationId.data),
    ]);

    return {
      data: rows.reverse(), // Reverse to show oldest first
      totalPages: Math.ceil(totalMessages / pagination.limit),
      currentPage: pagination.page,
      totalMessages,
    };
  } catch (error) {
    return {
      error: getErrorMessage(error),
      data: [],
      totalPages: 0,
      currentPage: pagination.page,
    };
  }
}

/** Get or create a private conversation with another user */
export async function getOrCreateConversation(otherUserId: string) {
  const user = await loadUser();
  if (!user) return { error: 'Not authenticated' };

  const parsedOtherUserId = userIdSchema.safeParse(otherUserId);
  if (!parsedOtherUserId.success) {
    return { error: firstZodError(parsedOtherUserId.error) };
  }

  if (parsedOtherUserId.data === user.id) {
    return { error: 'Cannot create a conversation with yourself' };
  }

  try {
    const conversationId = await getOrCreatePrivateConversation(
      user.id,
      parsedOtherUserId.data,
    );

    // The conversation was created or reused, so both participants refresh
    // their chat list and pick up the membership.
    const participantIds = await getConversationParticipantIds(conversationId);
    await publishRealtimeEvent({
      type: 'conversation:update',
      conversationId,
      participantIds,
    });

    return { conversationId };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

/** Get chat list (conversations with latest messages) */
export async function getChatList() {
  const user = await loadUser();
  if (!user) return { error: 'Not authenticated', data: [] };

  try {
    const data = await fetchChatList(user.id);
    return { data };
  } catch (error) {
    return { error: getErrorMessage(error), data: [] };
  }
}

/** Mark messages in a conversation as read */
export async function markAsRead(conversationId: string) {
  const user = await loadUser();
  if (!user) return { error: 'Not authenticated' };

  const parsedConversationId = conversationIdSchema.safeParse(conversationId);
  if (!parsedConversationId.success) {
    return { error: firstZodError(parsedConversationId.error) };
  }

  try {
    const membershipError = await ensureConversationMember(
      parsedConversationId.data,
      user.id,
    );
    if (membershipError) return { error: membershipError };

    await markConversationRead(parsedConversationId.data, user.id);
    return { success: true };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

/** Search users by name or email */
export async function searchUsers(keyword: string) {
  const user = await loadUser();
  if (!user) return { error: 'Not authenticated', data: [] };

  const pattern = resolvePattern(keyword);
  if (!pattern) return { data: [] };

  try {
    const data = await searchUsersByTerm(user.id, pattern);
    return { data };
  } catch (error) {
    return { error: getErrorMessage(error), data: [] };
  }
}

/** Search messages across all conversations the user is in */
export async function searchMessages(keyword: string) {
  const user = await loadUser();
  if (!user) return { error: 'Not authenticated', data: [] };

  const pattern = resolvePattern(keyword);
  if (!pattern) return { data: [] };

  try {
    const data = await searchMessagesByTerm(user.id, pattern);
    return { data };
  } catch (error) {
    return { error: getErrorMessage(error), data: [] };
  }
}

'use server';

import { createClient } from '@/lib/supabase/server';
import type { Attachment, Message, Profile } from '@/types/database';
import {
  ATTACHMENTS_BUCKET,
  createAttachmentSignedUrl,
  createAttachmentStoragePath,
  removeAttachmentObject,
  signAttachments,
} from './attachments';
import {
  ensureConversationMember,
  fetchChatList,
  getOwnedMessage,
  type ChatSupabaseClient,
} from './queries';
import {
  MAX_MESSAGE_LENGTH,
  attachmentFileSchema,
  firstZodError,
  getPagination,
  messageContentSchema,
  sanitizeSearchTerm,
  searchKeywordSchema,
  toIlikePattern,
  conversationIdSchema,
  messageIdSchema,
  userIdSchema,
} from './schemas';

type MessageRowWithRelations = Message & {
  sender?: Profile | null;
  attachments?: Attachment[] | null;
};

async function createAuthedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

async function withSignedMessageAttachments(supabase: ChatSupabaseClient, row: unknown) {
  const message = row as MessageRowWithRelations;
  const attachments = await signAttachments(supabase, message.attachments);

  return { ...message, attachments };
}

/** Send a text message in a conversation */
export async function sendMessage(conversationId: string, content: string) {
  const { supabase, user } = await createAuthedClient();

  if (!user) return { error: 'Not authenticated' };

  const parsedConversationId = conversationIdSchema.safeParse(conversationId);
  if (!parsedConversationId.success) {
    return { error: firstZodError(parsedConversationId.error) };
  }

  const parsedContent = messageContentSchema.safeParse(content);
  if (!parsedContent.success) {
    return { error: firstZodError(parsedContent.error) };
  }

  const membershipError = await ensureConversationMember(
    supabase,
    parsedConversationId.data,
    user.id,
  );
  if (membershipError) return { error: membershipError };

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: parsedConversationId.data,
      sender_id: user.id,
      content: parsedContent.data,
      type: 'text',
    })
    .select('*, sender:profiles!messages_sender_id_fkey(*), attachments(*)')
    .single();

  if (error) return { error: error.message };

  return { data: await withSignedMessageAttachments(supabase, data) };
}

/** Send a message with file attachment */
export async function sendAttachment(
  conversationId: string,
  formData: FormData,
  caption?: string,
) {
  const { supabase, user } = await createAuthedClient();

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
    supabase,
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

  const { error: uploadError } = await supabase.storage
    .from(ATTACHMENTS_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) return { error: uploadError.message };

  const signedUrl = await createAttachmentSignedUrl(supabase, storagePath);
  if (!signedUrl) {
    await removeAttachmentObject(supabase, storagePath);
    return { error: 'Failed to create a download link for the attachment' };
  }

  const messageType = file.type.startsWith('image/') ? 'image' : 'file';

  const { data: message, error: messageError } = await supabase
    .from('messages')
    .insert({
      conversation_id: parsedConversationId.data,
      sender_id: user.id,
      content,
      type: messageType,
    })
    .select('*, sender:profiles!messages_sender_id_fkey(*)')
    .single();

  if (messageError) {
    await removeAttachmentObject(supabase, storagePath);
    return { error: messageError.message };
  }

  const { data: attachment, error: attachmentError } = await supabase
    .from('attachments')
    .insert({
      message_id: message.id,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      file_url: signedUrl,
      storage_path: storagePath,
    })
    .select('*')
    .single();

  if (attachmentError) {
    await supabase.from('messages').delete().eq('id', message.id);
    await removeAttachmentObject(supabase, storagePath);
    return { error: attachmentError.message };
  }

  return {
    data: {
      ...message,
      attachments: [attachment as Attachment],
    },
  };
}

/** Edit a message (only own messages) */
export async function editMessage(messageId: string, newContent: string) {
  const { supabase, user } = await createAuthedClient();

  if (!user) return { error: 'Not authenticated' };

  const parsedMessageId = messageIdSchema.safeParse(messageId);
  if (!parsedMessageId.success) {
    return { error: firstZodError(parsedMessageId.error) };
  }

  const parsedContent = messageContentSchema.safeParse(newContent);
  if (!parsedContent.success) {
    return { error: firstZodError(parsedContent.error) };
  }

  const ownedMessage = await getOwnedMessage(supabase, parsedMessageId.data, user.id);
  if (ownedMessage.error) return { error: ownedMessage.error };

  const { data, error } = await supabase
    .from('messages')
    .update({
      content: parsedContent.data,
      is_edited: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsedMessageId.data)
    .eq('sender_id', user.id)
    .select('*, sender:profiles!messages_sender_id_fkey(*), attachments(*)')
    .single();

  if (error) return { error: error.message };

  return { data: await withSignedMessageAttachments(supabase, data) };
}

/** Soft-delete a message (only own messages) */
export async function deleteMessage(messageId: string) {
  const { supabase, user } = await createAuthedClient();

  if (!user) return { error: 'Not authenticated' };

  const parsedMessageId = messageIdSchema.safeParse(messageId);
  if (!parsedMessageId.success) {
    return { error: firstZodError(parsedMessageId.error) };
  }

  const ownedMessage = await getOwnedMessage(supabase, parsedMessageId.data, user.id);
  if (ownedMessage.error) return { error: ownedMessage.error };

  const { error } = await supabase
    .from('messages')
    .update({
      is_deleted: true,
      content: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', parsedMessageId.data)
    .eq('sender_id', user.id);

  if (error) return { error: error.message };
  return { success: true };
}

/** Get paginated messages for a conversation */
export async function getMessages(conversationId: string, page: number = 1) {
  const { supabase, user } = await createAuthedClient();

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

  const pagination = getPagination(page);
  const membershipError = await ensureConversationMember(
    supabase,
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

  const { data, error, count } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(*), attachments(*)', {
      count: 'exact',
    })
    .eq('conversation_id', parsedConversationId.data)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range(pagination.offset, pagination.offset + pagination.limit - 1);

  if (error) {
    return {
      error: error.message,
      data: [],
      totalPages: 0,
      currentPage: pagination.page,
    };
  }

  const rows = (data ?? []) as MessageRowWithRelations[];
  const signedMessages = await Promise.all(
    rows.map((row) => withSignedMessageAttachments(supabase, row)),
  );

  return {
    data: signedMessages.reverse(), // Reverse to show oldest first
    totalPages: Math.ceil((count ?? 0) / pagination.limit),
    currentPage: pagination.page,
    totalMessages: count ?? 0,
  };
}

/** Get or create a private conversation with another user */
export async function getOrCreateConversation(otherUserId: string) {
  const { supabase, user } = await createAuthedClient();

  if (!user) return { error: 'Not authenticated' };

  const parsedOtherUserId = userIdSchema.safeParse(otherUserId);
  if (!parsedOtherUserId.success) {
    return { error: firstZodError(parsedOtherUserId.error) };
  }

  if (parsedOtherUserId.data === user.id) {
    return { error: 'Cannot create a conversation with yourself' };
  }

  const { data, error } = await supabase.rpc('get_or_create_private_conversation', {
    user1_id: user.id,
    user2_id: parsedOtherUserId.data,
  });

  if (error) return { error: error.message };
  return { conversationId: data as string };
}

/** Get chat list (conversations with latest messages) */
export async function getChatList() {
  const { supabase, user } = await createAuthedClient();

  if (!user) return { error: 'Not authenticated', data: [] };

  const result = await fetchChatList(supabase, user.id);
  if (result.error) return { error: result.error, data: [] };

  return { data: result.data };
}

/** Mark messages in a conversation as read */
export async function markAsRead(conversationId: string) {
  const { supabase, user } = await createAuthedClient();

  if (!user) return { error: 'Not authenticated' };

  const parsedConversationId = conversationIdSchema.safeParse(conversationId);
  if (!parsedConversationId.success) {
    return { error: firstZodError(parsedConversationId.error) };
  }

  const membershipError = await ensureConversationMember(
    supabase,
    parsedConversationId.data,
    user.id,
  );
  if (membershipError) return { error: membershipError };

  const { error } = await supabase
    .from('conversation_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', parsedConversationId.data)
    .eq('user_id', user.id);

  if (error) return { error: error.message };
  return { success: true };
}

/** Search users by name or email */
export async function searchUsers(keyword: string) {
  const { supabase, user } = await createAuthedClient();

  if (!user) return { error: 'Not authenticated', data: [] };

  const parsedKeyword = searchKeywordSchema.safeParse(keyword);
  if (!parsedKeyword.success) return { data: [] };

  const term = sanitizeSearchTerm(parsedKeyword.data);
  if (term.length < 2) return { data: [] };

  const pattern = toIlikePattern(term);
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', user.id)
    .or(`name.ilike.${pattern},email.ilike.${pattern}`)
    .limit(20);

  if (error) return { error: error.message, data: [] };
  return { data: data ?? [] };
}

/** Search messages across all conversations the user is in */
export async function searchMessages(keyword: string) {
  const { supabase, user } = await createAuthedClient();

  if (!user) return { error: 'Not authenticated', data: [] };

  const parsedKeyword = searchKeywordSchema.safeParse(keyword);
  if (!parsedKeyword.success) return { data: [] };

  const term = sanitizeSearchTerm(parsedKeyword.data);
  if (term.length < 2) return { data: [] };

  const { data: memberships, error: membershipError } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', user.id);

  if (membershipError) return { error: membershipError.message, data: [] };
  if (!memberships?.length) return { data: [] };

  const conversationIds = memberships.map((membership) => membership.conversation_id);

  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(*)')
    .in('conversation_id', conversationIds)
    .eq('is_deleted', false)
    .ilike('content', toIlikePattern(term))
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return { error: error.message, data: [] };
  return { data: data ?? [] };
}

/** Update typing indicator */
export async function setTypingIndicator(conversationId: string, isTyping: boolean) {
  const { supabase, user } = await createAuthedClient();

  if (!user) return;

  const parsedConversationId = conversationIdSchema.safeParse(conversationId);
  if (!parsedConversationId.success) return;

  if (isTyping) {
    await supabase.from('typing_indicators').upsert(
      {
        conversation_id: parsedConversationId.data,
        user_id: user.id,
        started_at: new Date().toISOString(),
      },
      { onConflict: 'conversation_id,user_id' },
    );
  } else {
    await supabase
      .from('typing_indicators')
      .delete()
      .eq('conversation_id', parsedConversationId.data)
      .eq('user_id', user.id);
  }
}

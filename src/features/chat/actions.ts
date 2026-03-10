'use server';

import { createClient } from '@/lib/supabase/server';

const MESSAGES_PER_PAGE = 30;

/** Send a text message in a conversation */
export async function sendMessage(conversationId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };
  if (!content.trim()) return { error: 'Message cannot be empty' };

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim(),
      type: 'text',
    })
    .select('*, sender:profiles!messages_sender_id_fkey(*)')
    .single();

  if (error) return { error: error.message };
  return { data };
}

/** Send a message with file attachment */
export async function sendAttachment(
  conversationId: string,
  formData: FormData,
  caption?: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  const file = formData.get('file') as File | null;
  if (!file) return { error: 'No file provided' };

  // Upload file to storage
  const fileExt = file.name.split('.').pop();
  const storagePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(storagePath, file);

  if (uploadError) return { error: uploadError.message };

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('attachments').getPublicUrl(storagePath);

  // Determine message type
  const isImage = file.type.startsWith('image/');
  const messageType = isImage ? 'image' : 'file';

  // Create message
  const { data: message, error: msgError } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: caption || file.name,
      type: messageType,
    })
    .select('*, sender:profiles!messages_sender_id_fkey(*)')
    .single();

  if (msgError) return { error: msgError.message };

  // Create attachment record
  const { error: attachError } = await supabase.from('attachments').insert({
    message_id: message.id,
    file_name: file.name,
    file_type: file.type,
    file_size: file.size,
    file_url: publicUrl,
    storage_path: storagePath,
  });

  if (attachError) return { error: attachError.message };

  return {
    data: {
      ...message,
      attachments: [
        {
          id: crypto.randomUUID(),
          message_id: message.id,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_url: publicUrl,
          storage_path: storagePath,
          created_at: new Date().toISOString(),
        },
      ],
    },
  };
}

/** Edit a message (only own messages) */
export async function editMessage(messageId: string, newContent: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };
  if (!newContent.trim()) return { error: 'Message cannot be empty' };

  const { data, error } = await supabase
    .from('messages')
    .update({
      content: newContent.trim(),
      is_edited: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .eq('sender_id', user.id)
    .select('*, sender:profiles!messages_sender_id_fkey(*)')
    .single();

  if (error) return { error: error.message };
  return { data };
}

/** Soft-delete a message (only own messages) */
export async function deleteMessage(messageId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('messages')
    .update({
      is_deleted: true,
      content: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .eq('sender_id', user.id);

  if (error) return { error: error.message };
  return { success: true };
}

/** Get paginated messages for a conversation */
export async function getMessages(conversationId: string, page: number = 1) {
  const supabase = await createClient();

  const from = (page - 1) * MESSAGES_PER_PAGE;
  const to = from + MESSAGES_PER_PAGE - 1;

  const { data, error, count } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(*)', { count: 'exact' })
    .eq('conversation_id', conversationId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) return { error: error.message, data: [], totalPages: 0, currentPage: page };

  const totalPages = Math.ceil((count || 0) / MESSAGES_PER_PAGE);

  return {
    data: (data || []).reverse(), // Reverse to show oldest first
    totalPages,
    currentPage: page,
    totalMessages: count || 0,
  };
}

/** Get or create a private conversation with another user */
export async function getOrCreateConversation(otherUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  const { data, error } = await supabase.rpc('get_or_create_private_conversation', {
    user1_id: user.id,
    user2_id: otherUserId,
  });

  if (error) return { error: error.message };
  return { conversationId: data as string };
}

/** Get chat list (conversations with latest messages) */
export async function getChatList() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated', data: [] };

  // Get all conversations the user is a member of
  const { data: memberships, error: memberError } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', user.id);

  if (memberError) return { error: memberError.message, data: [] };
  if (!memberships?.length) return { data: [] };

  const conversationIds = memberships.map((m) => m.conversation_id);

  // Get conversations with members and latest message
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select(
      `
      *,
      conversation_members(
        user_id,
        last_read_at,
        profiles:profiles(*)
      )
    `,
    )
    .in('id', conversationIds)
    .order('updated_at', { ascending: false });

  if (convError) return { error: convError.message, data: [] };

  // Build chat list items
  const chatList = await Promise.all(
    (conversations || []).map(async (conv) => {
      // Get client user's membership info
      const members = (conv.conversation_members || []) as Array<{
        user_id: string;
        last_read_at: string;
        profiles: {
          id: string;
          name: string;
          email: string;
          avatar_url: string | null;
          status: string;
          last_seen: string;
          created_at: string;
          updated_at: string;
        };
      }>;

      // Find the other user in the conversation
      const otherMember = members.find((m) => m.user_id !== user.id);
      const currentMember = members.find((m) => m.user_id === user.id);

      // Get latest message
      const { data: lastMessages } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const lastMessage = lastMessages?.[0] || null;

      // Count unread messages
      let unreadCount = 0;
      if (currentMember?.last_read_at && lastMessage) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', user.id)
          .gt('created_at', currentMember.last_read_at);
        unreadCount = count || 0;
      }

      return {
        conversation: {
          id: conv.id,
          type: conv.type,
          name: conv.name,
          avatar_url: conv.avatar_url,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
        },
        otherUser: otherMember?.profiles || null,
        lastMessage,
        unreadCount,
      };
    }),
  );

  return { data: chatList };
}

/** Mark messages in a conversation as read */
export async function markAsRead(conversationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from('conversation_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', user.id);
}

/** Search users by name or email */
export async function searchUsers(keyword: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated', data: [] };
  if (keyword.length < 2) return { data: [] };

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', user.id)
    .or(`name.ilike.%${keyword}%,email.ilike.%${keyword}%`)
    .limit(20);

  if (error) return { error: error.message, data: [] };
  return { data: data || [] };
}

/** Search messages across all conversations the user is in */
export async function searchMessages(keyword: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated', data: [] };
  if (keyword.length < 2) return { data: [] };

  // Get user's conversation IDs
  const { data: memberships } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', user.id);

  if (!memberships?.length) return { data: [] };

  const conversationIds = memberships.map((m) => m.conversation_id);

  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(*)')
    .in('conversation_id', conversationIds)
    .ilike('content', `%${keyword}%`)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return { error: error.message, data: [] };
  return { data: data || [] };
}

/** Update typing indicator */
export async function setTypingIndicator(conversationId: string, isTyping: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  if (isTyping) {
    await supabase.from('typing_indicators').upsert(
      {
        conversation_id: conversationId,
        user_id: user.id,
        started_at: new Date().toISOString(),
      },
      { onConflict: 'conversation_id,user_id' },
    );
  } else {
    await supabase
      .from('typing_indicators')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);
  }
}

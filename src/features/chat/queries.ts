import type { SupabaseClient } from '@supabase/supabase-js';
import type { ChatListItem } from '@/types/chat';
import type { Database, Message, Profile } from '@/types/database';

export type ChatSupabaseClient = SupabaseClient<Database>;

interface MembershipRow {
  conversation_id: string;
  last_read_at: string | null;
  joined_at: string;
}

interface ConversationMemberRow {
  conversation_id: string;
  user_id: string;
  last_read_at: string | null;
  profiles: Profile | Profile[] | null;
}

interface MessageOwnershipRow {
  id: string;
  conversation_id: string;
  sender_id: string;
}

/**
 * Verify the current user belongs to a conversation. Returns an error message
 * when the membership cannot be confirmed, otherwise `null`.
 */
export async function ensureConversationMember(
  supabase: ChatSupabaseClient,
  conversationId: string,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return error.message;
  if (!data) return 'You are not a member of this conversation';

  return null;
}

/**
 * Load a message and ensure the current user owns it. Ownership updates should
 * always go through this guard instead of relying on the update filter alone.
 */
export async function getOwnedMessage(
  supabase: ChatSupabaseClient,
  messageId: string,
  userId: string,
): Promise<{ message?: MessageOwnershipRow; error?: string }> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id')
    .eq('id', messageId)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!data) return { error: 'Message not found' };
  if (data.sender_id !== userId) {
    return { error: 'You can only modify your own messages' };
  }

  const membershipError = await ensureConversationMember(
    supabase,
    data.conversation_id,
    userId,
  );

  if (membershipError) return { error: membershipError };

  return { message: data };
}

function normalizeProfile(
  profile: Profile | Profile[] | null | undefined,
): Profile | null {
  if (Array.isArray(profile)) return profile[0] ?? null;
  return profile ?? null;
}

function isNewerThan(timestamp: string, reference: string): boolean {
  return new Date(timestamp).getTime() > new Date(reference).getTime();
}

/**
 * Build the chat list with a fixed number of queries, regardless of how many
 * conversations the user belongs to.
 */
export async function fetchChatList(
  supabase: ChatSupabaseClient,
  userId: string,
): Promise<{ data: ChatListItem[]; error?: string }> {
  const { data: memberships, error: membershipError } = await supabase
    .from('conversation_members')
    .select('conversation_id, last_read_at, joined_at')
    .eq('user_id', userId);

  if (membershipError) {
    return { data: [], error: membershipError.message };
  }
  if (!memberships?.length) {
    return { data: [] };
  }

  const conversationIds = memberships.map((membership) => membership.conversation_id);
  const membershipByConversation = new Map<string, MembershipRow>(
    memberships.map((membership) => [membership.conversation_id, membership]),
  );

  const { data: conversations, error: conversationError } = await supabase
    .from('conversations')
    .select('*')
    .in('id', conversationIds)
    .order('updated_at', { ascending: false });

  if (conversationError) {
    return { data: [], error: conversationError.message };
  }
  if (!conversations?.length) {
    return { data: [] };
  }

  const { data: members, error: memberError } = await supabase
    .from('conversation_members')
    .select('conversation_id, user_id, last_read_at, profiles(*)')
    .in('conversation_id', conversationIds);

  if (memberError) {
    return { data: [], error: memberError.message };
  }

  const { data: messages, error: messageError } = await supabase
    .from('messages')
    .select('*')
    .in('conversation_id', conversationIds)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (messageError) {
    return { data: [], error: messageError.message };
  }

  const membersByConversation = new Map<string, ConversationMemberRow[]>();
  for (const member of (members ?? []) as ConversationMemberRow[]) {
    const conversationMembers = membersByConversation.get(member.conversation_id) ?? [];
    conversationMembers.push(member);
    membersByConversation.set(member.conversation_id, conversationMembers);
  }

  const latestMessageByConversation = new Map<string, Message>();
  const unreadCountByConversation = new Map<string, number>();

  for (const message of messages ?? []) {
    if (!latestMessageByConversation.has(message.conversation_id)) {
      latestMessageByConversation.set(message.conversation_id, message);
    }

    const membership = membershipByConversation.get(message.conversation_id);
    const lastReadAt = membership?.last_read_at ?? membership?.joined_at ?? null;

    if (
      message.sender_id !== userId &&
      lastReadAt &&
      isNewerThan(message.created_at, lastReadAt)
    ) {
      unreadCountByConversation.set(
        message.conversation_id,
        (unreadCountByConversation.get(message.conversation_id) ?? 0) + 1,
      );
    }
  }

  const data: ChatListItem[] = conversations.map((conversation) => {
    const conversationMembers = membersByConversation.get(conversation.id) ?? [];
    const otherMember = conversationMembers.find((member) => member.user_id !== userId);

    return {
      conversation,
      otherUser: normalizeProfile(otherMember?.profiles),
      lastMessage: latestMessageByConversation.get(conversation.id) ?? null,
      unreadCount: unreadCountByConversation.get(conversation.id) ?? 0,
    };
  });

  return { data };
}

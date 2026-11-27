import type { Profile, Message, Conversation, Attachment } from './database';

// ============================================================================
// Chat domain types
// ============================================================================

/** Aggregated reaction pill for a message */
export interface ReactionSummary {
  emoji: string;
  userIds: string[];
}

/** Lightweight preview of a quoted/replied-to message */
export interface ReplyPreview {
  id: string;
  senderId: string;
  senderName: string;
  content: string | null;
  isDeleted: boolean;
}

/** A group member with their role */
export interface GroupMember extends Profile {
  role: 'admin' | 'member';
}

/** A conversation with its latest message and other member's profile (or group members) */
export interface ChatListItem {
  conversation: Conversation;
  otherUser: Profile | null;
  members?: GroupMember[];
  lastMessage: Message | null;
  unreadCount: number;
}

/** A message with sender profile, optional attachments, reactions, and reply preview */
export interface MessageWithSender extends Message {
  sender: Profile;
  attachments?: Attachment[];
  reactions?: ReactionSummary[];
  replyTo?: ReplyPreview | null;
}

/** Grouped messages from the same sender within a time window */
export interface MessageGroup {
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  messages: MessageWithSender[];
}

/** Search results combining users and messages */
export interface SearchResults {
  users: Profile[];
  messages: (Message & { sender: Profile; conversation_id: string })[];
}

/** State for message being edited */
export interface EditingMessage {
  id: string;
  content: string;
}

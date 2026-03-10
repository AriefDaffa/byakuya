import type { Profile, Message, Conversation, Attachment } from './database';

// ============================================================================
// Chat domain types
// ============================================================================

/** A conversation with its latest message and other member's profile */
export interface ChatListItem {
  conversation: Conversation;
  otherUser: Profile;
  lastMessage: Message | null;
  unreadCount: number;
}

/** A message with sender profile and optional attachments for display */
export interface MessageWithSender extends Message {
  sender: Profile;
  attachments?: Attachment[];
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

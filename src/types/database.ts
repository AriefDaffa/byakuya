// ============================================================================
// Standalone PostgreSQL Domain Types
// ============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserStatus = 'online' | 'offline' | 'away';

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  status: UserStatus | null;
  last_seen: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  type: 'private' | 'group';
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'admin' | 'member' | null;
  joined_at: string;
  last_read_at: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  type: 'text' | 'image' | 'file' | 'system' | null;
  is_edited: boolean | null;
  is_deleted: boolean | null;
  reply_to_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: string;
  message_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
  storage_path: string;
  created_at: string;
}

export type InsertMessage = {
  id?: string;
  conversation_id: string;
  sender_id: string;
  content?: string | null;
  type?: 'text' | 'image' | 'file' | 'system' | null;
  is_edited?: boolean | null;
  is_deleted?: boolean | null;
  reply_to_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

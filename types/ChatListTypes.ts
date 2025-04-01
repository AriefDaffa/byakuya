export interface ChatListTypeResponse {
  success: boolean;
  message: string;
  data: ChatListType[];
}

export interface ChatListType {
  id: string;
  type: string;
  users: User[];
  latestMessage: LatestMessage;
  unreadCount: number;
}

export interface User {
  id: string;
  name: string;
  image: string | null;
}

export interface LatestMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  privateChatId: string;
  groupChatId: string | null;
  userId: string | null;
}

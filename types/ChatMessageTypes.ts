export interface ChatMessageTypesResponse {
  success: boolean;
  message: string;
  data: ChatMessageTypes;
}

export interface ChatMessageTypes {
  receiver: Receiver[];
  messages: MessageTypes[];
  pagination: Pagination;
}

export interface Receiver {
  id: string;
  userId: string;
  privateChatId: string;
  user: User;
}

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MessageTypes {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  privateChatId: string;
  groupChatId: string | null;
  userId: string | null;
  seenBy: SeenBy[];
}

export interface SeenBy {
  userId: string;
  user: User2;
}

export interface User2 {
  id: string;
  name: string;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalMessages: number;
}

export interface FormattedMessages {
  id: string;
  sender: string;
  avatar: string;
  time: string;
  content: string;
  isSelf: boolean;
}

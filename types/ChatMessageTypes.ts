export interface ChatMessageTypes {
  success: boolean;
  messages: MessageTypes[];
  pagination: Pagination;
}

export interface MessageTypes {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  seenBy: SeenBy[];
}

export interface SeenBy {
  userId: string;
  user: {
    id: string;
    name: string;
  };
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalMessages: number;
}

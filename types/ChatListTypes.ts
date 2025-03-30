export interface ChatListType {
  id: string;
  type: string;
  users: User[];
  latestMessage: LatestMessage;
}

export interface User {
  id: string;
  name: string;
  image: string | null;
}

export interface LatestMessage {
  id: string;
  content: string;
  createdAt: string;
}

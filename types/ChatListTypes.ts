export interface ChatListResponse {
  success: boolean;
  message: string;
  data: ChatListData[];
}

export interface ChatListData {
  id: string;
  name: string;
  email: string;
  image: string;
  latestMessage: LatestMessage;
}

export interface LatestMessage {
  id: string;
  content: string;
  createdAt: string;
}

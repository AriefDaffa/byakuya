import { UserTypes } from './common/UserTypes';

export interface ChatListResponse {
  success: boolean;
  message: string;
  data: ChatListData[];
}

export interface ChatListData extends UserTypes {
  latestMessage: LatestMessage;
}

export interface LatestMessage {
  id: string;
  content: string;
  createdAt: string;
}

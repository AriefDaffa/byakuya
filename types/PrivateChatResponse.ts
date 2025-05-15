import { UserTypes } from './common/UserTypes';

export interface PrivateChatResponse {
  success: boolean;
  message: string;
  data: PrivateChatData;
}
export interface PrivateChatData {
  currentPage: number;
  totalPages: number;
  totalMessages: number;
  messages: MessagesItem[];
}
export interface MessagesItem {
  id: string;
  content: string;
  createdAt: string;
  privateChatId: string;
  sender: UserTypes;
  receiver: UserTypes;
}

export interface FormattedMsg {
  id: string;
  name: string;
  email: string;
  image: string;
  messages: MessagesItem[];
}

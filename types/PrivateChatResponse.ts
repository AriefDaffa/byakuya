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
  sender: Sender;
  receiver: Receiver;
}
export interface Sender {
  id: string;
  name: string;
  email: string;
  image: string;
}
export interface Receiver {
  id: string;
  name: string;
  email: string;
  image: string;
}

export interface FormattedMsg {
  id: string;
  name: string;
  email: string;
  image: string;
  messages: MessagesItem[];
}

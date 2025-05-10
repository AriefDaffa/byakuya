export interface MessagesTypes {
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

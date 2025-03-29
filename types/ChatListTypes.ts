interface Chat {
  avatar: string;
  name: string;
  message: string;
  time: string;
  unread: number;
  active: boolean;
  fallback: string;
}

export interface IChatListTypes {
  chats: Chat[];
}

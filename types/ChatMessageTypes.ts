// export interface ChatMessageTypes {
//   success: boolean;
//   messages: MessageTypes[];
//   receiver: Receiver[];
//   pagination: Pagination;
// }

// export interface Receiver {
//   id: string;
//   userId: string;
//   privateChatId: string;
//   user: User;
// }

// export interface MessageTypes {
//   id: string;
//   senderId: string;
//   content: string;
//   createdAt: string;
//   seenBy: SeenBy[];
// }

// export interface SeenBy {
//   userId: string;
//   user: {
//     id: string;
//     name: string;
//   };
// }

// export interface Pagination {
//   currentPage: number;
//   totalPages: number;
//   totalMessages: number;
// }

// export interface User {
//   id: string;
//   name: string;
//   email: string;
//   emailVerified: boolean;
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   image: any;
//   createdAt: string;
//   updatedAt: string;
// }

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

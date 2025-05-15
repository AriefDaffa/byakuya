import { UserTypes } from './common/UserTypes';

export interface SearchMessageResponse {
  success: boolean;
  message: string;
  data: SearchMessageData[];
}

export interface SearchMessageData extends UserTypes {
  messageId: string;
  content: string;
  createdAt: string;
  roomId: string;
}

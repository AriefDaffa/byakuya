import { z } from 'zod';
import { UserData } from './UserTypes';

export const ZSidebarTypes = z.object({
  keyword: z.string().min(3, { message: 'Minimum 3 characters' }),
});

export interface SidebarSearchResponse {
  success: boolean;
  message: string;
  data: SidebarSearchData[];
}

export interface SidebarSearchData {
  userId: string;
  userName: string;
  userEmail: string;
  userImage: string;
  messageId: string;
  content: string;
  createdAt: string;
  roomId: string;
}

export interface SidebarMergedData {
  messages: SidebarSearchData[];
  users: UserData[];
}

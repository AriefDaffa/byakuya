import { z } from 'zod';
import { UserTypes } from './common/UserTypes';

export const ZUserTypes = z.object({
  keyword: z.string().min(3, { message: 'Minimum 3 characters' }),
});

export interface UserResponse {
  success: boolean;
  message: string;
  data: UserData[];
}

export interface UserData extends UserTypes {
  privateChats: PrivateChats[];
}

interface PrivateChats {
  id: string;
  userId: string;
  privateChatId: string;
}

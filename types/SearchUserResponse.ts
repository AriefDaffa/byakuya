import { UserTypes } from './common/UserTypes';

export interface SearchUserResponse {
  success: boolean;
  message: string;
  data: SearchUserData[];
}

export interface SearchUserData extends UserTypes {
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

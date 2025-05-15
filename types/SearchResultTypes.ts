import { SearchMessageData } from './SearchMessageResponse';
import { SearchUserData } from './SearchUserResponse';

export interface MergedResult {
  users: SearchUserData[];
  messages: SearchMessageData[];
}

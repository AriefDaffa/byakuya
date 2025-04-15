import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/avatar';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/atoms/command';
import { Input } from '@/components/atoms/input';
import { CreateChatPayload } from '@/hooks/fetch/useCreatePrivateChat';
import { User } from '@/types/ChatListTypes';
import { UserData } from '@/types/UserTypes';
import { SearchIcon } from 'lucide-react';
import type { Dispatch, FC, SetStateAction } from 'react';

interface SearchUserDialogProps {
  openDialog: boolean;
  isSearching: boolean;
  isCreatePCLoading: boolean;
  setOpenDialog: Dispatch<SetStateAction<boolean>>;
  handleKeywordChange: (e: string) => void;
  handleOnUserClick: (payload: CreateChatPayload, receiverData: User) => void;
  usersList?: UserData[];
  senderId?: string;
}

const SearchUserDialog: FC<SearchUserDialogProps> = ({
  openDialog,
  setOpenDialog,
  handleKeywordChange,
  usersList = [],
  isSearching,
  handleOnUserClick,
  senderId = '',
  isCreatePCLoading,
}) => {
  return (
    <CommandDialog open={openDialog} onOpenChange={setOpenDialog}>
      <div
        data-slot="command-input-wrapper"
        className="flex h-9 items-center gap-2 border-b px-3"
      >
        <SearchIcon className="size-4 shrink-0 opacity-50" />
        <Input
          style={{ background: 'none' }}
          className="focus-visible:ring-transparent border-0 bg-red-200"
          placeholder="Search user..."
          onChange={(e) => handleKeywordChange(e.target.value)}
        />
      </div>
      <CommandList>
        {isSearching || isCreatePCLoading ? (
          <CommandEmpty>Loading...</CommandEmpty>
        ) : usersList.length === 0 ? (
          <CommandEmpty>No results found.</CommandEmpty>
        ) : (
          <CommandGroup heading="Search result" className="mb-2">
            {usersList.map((item, idx) => (
              <div
                onClick={() =>
                  handleOnUserClick(
                    {
                      sender_id: senderId,
                      receiver_id: item.id,
                    },
                    item
                  )
                }
                className="cursor-pointer"
                key={idx}
              >
                <CommandItem>
                  <Avatar className={`h-10 w-10`}>
                    <AvatarImage src={item.image} alt={''} />
                    <AvatarFallback>{item.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>{item.name}</div>
                </CommandItem>
              </div>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
};

export default SearchUserDialog;

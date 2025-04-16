import { Video, Phone, MoreVertical } from 'lucide-react';

import { Button } from '@/components/atoms/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/avatar';

interface ChatHeaderProps {
  name: string;
  status: string;
  avatar: string;
  className?: string;
  handleOpenProfile: () => void;
}

const ChatHeader = ({
  name,
  avatar,
  className,
  handleOpenProfile,
}: ChatHeaderProps) => {
  return (
    <div
      className={`border-b p-4 flex items-center justify-between ${className}`}
    >
      <div className="flex items-center gap-3" onClick={handleOpenProfile}>
        <Avatar className={`h-10 w-10`}>
          <AvatarImage src={avatar} alt={''} />
          <AvatarFallback>{name.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-lg">{name}</h2>
          <p className="text-sm text-muted-foreground">Available</p>
        </div>
      </div>
      <div className=" items-center gap-2 hidden md:flex">
        <Button variant="ghost" size="icon" className="rounded-full">
          <Video className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Phone className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
          <MoreVertical className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
};

export default ChatHeader;

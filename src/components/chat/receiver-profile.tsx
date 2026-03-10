'use client';

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface ReceiverProfileProps {
  avatar?: string;
  name?: string;
  email?: string;
  status?: string;
}

export function ReceiverProfile({
  avatar,
  name = '',
  email = '',
  status,
}: ReceiverProfileProps) {
  return (
    <div className="flex size-full flex-col items-center justify-center space-y-6 px-4 py-8">
      <Avatar className="size-32">
        <AvatarImage src={avatar} alt={name} />
        <AvatarFallback className="text-4xl">
          {name.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="text-center">
        <h2 className="text-3xl font-bold">{name}</h2>
        <p className="text-muted-foreground">{email}</p>
        {status && (
          <p className="text-muted-foreground mt-1 text-sm capitalize">{status}</p>
        )}
      </div>
    </div>
  );
}

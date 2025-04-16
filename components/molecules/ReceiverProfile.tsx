import { Avatar, AvatarImage } from '@/components/atoms/avatar';
import { GlareCard } from '@/components/atoms/glare-card';
import type { FC } from 'react';

interface ReceiverProfileProps {
  avatar?: string;
  name?: string;
}

const ReceiverProfile: FC<ReceiverProfileProps> = ({ avatar, name = '' }) => {
  return (
    <div className="size-full py-8 flex justify-center flex-col space-y-4">
      <div className="w-full flex items-center justify-center">
        <GlareCard className="flex flex-col items-center justify-center w-full">
          <Avatar className=" rounded-2xl size-full">
            <AvatarImage src={avatar} alt={''} />
          </Avatar>
        </GlareCard>
      </div>
      <div className="">
        <div className="text-center text-4xl font-bold">{name}</div>
      </div>
    </div>
  );
};

export default ReceiverProfile;

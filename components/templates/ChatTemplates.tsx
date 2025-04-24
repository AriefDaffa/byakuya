import { cn } from '@/lib/utils';
import type { FC, ReactNode } from 'react';

interface ChatTemplatesProps {
  sidebar: ReactNode;
  chatSection: ReactNode;
  mobileComp: ReactNode;
}

const ChatTemplates: FC<ChatTemplatesProps> = ({
  sidebar,
  chatSection,
  mobileComp,
}) => {
  return (
    <div className="h-screen flex flex-col justify-center items-center relative overflow-x-hidden">
      <div className={cn('flex size-full bg-background rounded-md')}>
        <div className="flex size-full rounded-lg md:max-w-[350px] lg:max-w-[450px]">
          <div className="w-full">{sidebar}</div>
        </div>
        <div className="flex-1 w-full relative hidden md:flex">
          {chatSection}
        </div>
      </div>
      <div className="block md:hidden">{mobileComp}</div>
    </div>
  );
};

export default ChatTemplates;

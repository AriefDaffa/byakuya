import { cn } from '@/lib/utils';
import type { FC, ReactNode } from 'react';

interface ChatTemplatesProps {
  sidebar: ReactNode;
  chatSection: ReactNode;
  navbarSection: ReactNode;
}

const ChatTemplates: FC<ChatTemplatesProps> = ({
  navbarSection,
  sidebar,
  chatSection,
}) => {
  return (
    <div className="h-screen flex flex-col justify-center items-center">
      {navbarSection}
      <div className={cn('flex size-full bg-background rounded-md')}>
        <div className="size-full rounded-lg md:max-w-[380px]">{sidebar}</div>
        <div className="flex-1 rounded-lg flex-col relative hidden md:flex">
          {chatSection}
        </div>
      </div>
    </div>
  );
};

export default ChatTemplates;

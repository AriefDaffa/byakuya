import { cn } from '@/lib/utils';
import type { FC, ReactNode } from 'react';

interface ChatTemplatesProps {
  sidebar: ReactNode;
  chatSection: ReactNode;
  sideMenu: ReactNode;
  rightSidebar: ReactNode;
  mobileComp: ReactNode;
}

const ChatTemplates: FC<ChatTemplatesProps> = ({
  sideMenu,
  sidebar,
  chatSection,
  rightSidebar,
  mobileComp,
}) => {
  return (
    <div className="h-screen flex flex-col justify-center items-center relative overflow-x-hidden">
      <div className={cn('flex size-full bg-background rounded-md')}>
        <div className="flex size-full rounded-lg md:max-w-[450px]">
          <div className="hidden md:w-[15%] lg:block">{sideMenu}</div>
          <div className="w-full lg:w-[85%]">{sidebar}</div>
        </div>
        <div className="flex-1 w-full relative hidden md:flex">
          {chatSection}
          {rightSidebar}
        </div>
      </div>
      <div className="block md:hidden">{mobileComp}</div>
    </div>
  );
};

export default ChatTemplates;

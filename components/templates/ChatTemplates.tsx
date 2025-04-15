import { cn } from '@/lib/utils';
import type { FC, ReactNode } from 'react';

interface ChatTemplatesProps {
  sidebar: ReactNode;
  chatSection: ReactNode;
  sideMenu: ReactNode;
}

const ChatTemplates: FC<ChatTemplatesProps> = ({
  sideMenu,
  sidebar,
  chatSection,
}) => {
  return (
    <div className="h-screen flex flex-col justify-center items-center">
      {/* {navbarSection} */}
      <div className={cn('flex size-full bg-background rounded-md')}>
        <div className="flex size-full rounded-lg md:max-w-[450px]">
          <div className="w-[12%]">{sideMenu}</div>
          <div className="w-[88%]">{sidebar}</div>
        </div>
        <div className="flex-1 rounded-lg flex-row relative hidden md:flex">
          {chatSection}
        </div>
      </div>
    </div>
  );
};

export default ChatTemplates;

import { cn } from '@/lib/utils';
import type { FC, ReactNode } from 'react';

interface ChatTemplatesProps {
  sidebar: ReactNode;
  chatSection: ReactNode;
}

const ChatTemplates: FC<ChatTemplatesProps> = ({ sidebar, chatSection }) => {
  return (
    <div className={cn('flex h-screen bg-background')}>
      {sidebar}
      <div className="flex-1 flex flex-col">{chatSection}</div>
    </div>
  );
};

export default ChatTemplates;

import { cn } from '@/lib/utils';
import type { FC, ReactNode } from 'react';

interface ChatTemplatesProps {
  sidebar: ReactNode;
  header: ReactNode;
  messageThread: ReactNode;
  messageInput: ReactNode;
}

const ChatTemplates: FC<ChatTemplatesProps> = ({
  sidebar,
  messageThread,
  header,
  messageInput,
}) => {
  return (
    <div className={cn('flex h-screen bg-background')}>
      {sidebar}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {header}
        {messageThread}
        {messageInput}
      </div>
    </div>
  );
};

export default ChatTemplates;

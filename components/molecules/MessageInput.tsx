'use client';

import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Send } from 'lucide-react';

interface MessageInputProps {
  msg: string;
  setMsg: (text: string) => void;
  className?: string;
  handleMessageSent: () => void;
  onSend?: (message: string) => void;
}

const MessageInput = ({
  msg,
  setMsg,
  handleMessageSent,
  className,
}: MessageInputProps) => {
  return (
    <div className={` p-4 z-10 flex items-center gap-2 ${className}`}>
      <Input
        placeholder="Type a message"
        className="flex-1 bg-muted/50 border-0 rounded-full"
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleMessageSent()}
      />
      {/* <Button variant="ghost" size="icon" className="rounded-full">
        <Smile className="h-5 w-5 text-muted-foreground" />
      </Button>
      <Button variant="ghost" size="icon" className="rounded-full">
        <Paperclip className="h-5 w-5 text-muted-foreground" />
      </Button>
      <Button variant="ghost" size="icon" className="rounded-full">
        <Mic className="h-5 w-5 text-muted-foreground" />
      </Button> */}
      <Button size="icon" className="rounded-full" onClick={handleMessageSent}>
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default MessageInput;

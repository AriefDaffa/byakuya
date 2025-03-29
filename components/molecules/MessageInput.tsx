'use client';

import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Smile, Paperclip, Mic, Send } from 'lucide-react';
import { useState } from 'react';

interface MessageInputProps {
  onSend?: (message: string) => void;
  className?: string;
}

const MessageInput = ({ onSend, className }: MessageInputProps) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSend?.(message);
      setMessage('');
    }
  };

  return (
    <div className={`border-t p-4 flex items-center gap-2 ${className}`}>
      <Input
        placeholder="Type a message"
        className="flex-1 bg-muted/50 border-0 rounded-full"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
      />
      <Button variant="ghost" size="icon" className="rounded-full">
        <Smile className="h-5 w-5 text-muted-foreground" />
      </Button>
      <Button variant="ghost" size="icon" className="rounded-full">
        <Paperclip className="h-5 w-5 text-muted-foreground" />
      </Button>
      <Button variant="ghost" size="icon" className="rounded-full">
        <Mic className="h-5 w-5 text-muted-foreground" />
      </Button>
      <Button size="icon" className="rounded-full" onClick={handleSend}>
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default MessageInput;

'use client';

import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCallback } from 'react';

interface MessageInputProps {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  className?: string;
  disabled?: boolean;
}

export function MessageInput({
  value,
  onChange,
  onSend,
  className,
  disabled,
}: MessageInputProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    },
    [onSend],
  );

  return (
    <div className={cn('z-10 flex items-center gap-2 p-4', className)}>
      <input
        type="text"
        placeholder="Type a message..."
        className="bg-muted/50 placeholder:text-muted-foreground focus:ring-ring flex-1 rounded-full border-0 px-4 py-2 text-sm ring-0 outline-none focus:ring-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-label="Message input"
      />
      <button
        type="button"
        onClick={onSend}
        disabled={disabled || !value.trim()}
        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex size-10 items-center justify-center rounded-full transition-colors disabled:opacity-50"
        aria-label="Send message"
      >
        <Send className="size-5" />
      </button>
    </div>
  );
}

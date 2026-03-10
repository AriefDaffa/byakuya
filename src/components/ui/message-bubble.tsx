import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  children: ReactNode;
  variant: 'sent' | 'received';
  className?: string;
}

export function MessageBubble({ children, variant, className }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        'w-fit max-w-[50vh] rounded-b-2xl p-3',
        variant === 'sent'
          ? 'bg-primary text-primary-foreground rounded-tl-2xl'
          : 'bg-muted text-foreground rounded-tr-2xl',
        className,
      )}
    >
      {children}
    </div>
  );
}

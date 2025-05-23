import type { ReactNode } from 'react';

interface MessageBubbleProps {
  children: ReactNode;
  variant: 'sent' | 'received';
}

export const MessageBubble = ({ children, variant }: MessageBubbleProps) => {
  return (
    <div
      className={`p-3 rounded-b-2xl w-fit max-w-[50vh] ${
        variant === 'sent'
          ? 'bg-blue-500 text-white rounded-tl-2xl'
          : 'bg-gray-100 text-gray-800 rounded-tr-2xl'
      }`}
    >
      {children}
    </div>
  );
};

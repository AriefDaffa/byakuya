'use client';

import { Send, Paperclip, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCallback, useRef } from 'react';
import type { EditingMessage } from '@/types/chat';

interface MessageInputProps {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  onSendAttachment?: (file: File, caption?: string) => void;
  editingMessage?: EditingMessage | null;
  onCancelEdit?: () => void;
  className?: string;
  disabled?: boolean;
}

const ACCEPTED_FILE_TYPES = 'image/*,.pdf,.doc,.docx,.txt,.zip,.rar';

export function MessageInput({
  value,
  onChange,
  onSend,
  onSendAttachment,
  editingMessage,
  onCancelEdit,
  className,
  disabled,
}: MessageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
      if (e.key === 'Escape' && editingMessage) {
        e.preventDefault();
        onCancelEdit?.();
      }
    },
    [onSend, editingMessage, onCancelEdit],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && onSendAttachment) {
        onSendAttachment(file);
      }
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [onSendAttachment],
  );

  return (
    <div className={cn('z-10 flex flex-col', className)}>
      {/* Edit mode banner */}
      {editingMessage && (
        <div className="bg-muted/50 flex items-center gap-2 border-t px-4 py-2">
          <div className="flex-1 truncate">
            <p className="text-xs font-medium text-blue-500">Editing message</p>
            <p className="text-muted-foreground truncate text-xs">
              {editingMessage.content}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancelEdit}
            className="hover:bg-accent inline-flex size-6 shrink-0 items-center justify-center rounded-full transition-colors"
            aria-label="Cancel editing"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 p-4">
        {/* Attachment button */}
        {onSendAttachment && !editingMessage && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Attach file"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="text-muted-foreground hover:text-foreground hover:bg-accent inline-flex size-10 shrink-0 items-center justify-center rounded-full transition-colors disabled:opacity-50"
              aria-label="Attach file"
            >
              <Paperclip className="size-5" />
            </button>
          </>
        )}

        <input
          type="text"
          placeholder={editingMessage ? 'Edit your message...' : 'Type a message...'}
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
          className={cn(
            'inline-flex size-10 items-center justify-center rounded-full transition-colors disabled:opacity-50',
            editingMessage
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-primary text-primary-foreground hover:bg-primary/90',
          )}
          aria-label={editingMessage ? 'Save edit' : 'Send message'}
        >
          <Send className="size-5" />
        </button>
      </div>
    </div>
  );
}

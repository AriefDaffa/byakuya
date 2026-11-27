'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PixelClipIcon, PixelSendIcon } from '@/components/ui/pixel-icons';
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

const ACCEPTED_FILE_TYPES =
  'image/png,image/jpeg,image/gif,image/webp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.rtf';

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
      // `isComposing` guards against sending while an IME candidate window is
      // open (e.g. Japanese/Chinese input).
      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
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
        <div className="bg-muted flex items-center gap-2 border-t-2 border-[var(--pixel-frame)] px-3 py-2 sm:px-4">
          <div className="min-w-0 flex-1">
            <p className="font-sans text-[11px] font-semibold tracking-wider text-[var(--unread)] uppercase">
              Editing message
            </p>
            <p className="text-muted-foreground truncate font-sans text-xs">
              {editingMessage.content}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancelEdit}
            className="pixel-btn bg-card text-foreground inline-flex size-7 shrink-0 items-center justify-center"
            aria-label="Cancel editing"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <div className="bg-card flex items-center gap-2 border-t-2 border-[var(--pixel-frame)] p-2.5 sm:p-3">
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
              className="pixel-btn bg-secondary text-secondary-foreground inline-flex size-10 shrink-0 items-center justify-center disabled:opacity-50"
              aria-label="Attach file"
            >
              <PixelClipIcon className="size-5" />
            </button>
          </>
        )}

        <input
          type="text"
          placeholder={editingMessage ? 'Edit your message...' : 'Write a message...'}
          className="pixel-input placeholder:text-muted-foreground h-10 min-w-0 flex-1 rounded-none px-3 font-sans text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
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
            'pixel-btn inline-flex size-10 shrink-0 items-center justify-center disabled:opacity-50',
            editingMessage
              ? 'bg-[var(--unread)] text-[#090c12]'
              : 'md:bg-primary md:text-primary-foreground bg-[#16a34a] text-white',
          )}
          aria-label={editingMessage ? 'Save edit' : 'Send message'}
        >
          <PixelSendIcon className="size-5" />
        </button>
      </div>
    </div>
  );
}

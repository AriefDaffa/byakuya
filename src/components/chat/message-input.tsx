'use client';

import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PixelClipIcon, PixelSendIcon } from '@/components/ui/pixel-icons';
import { SLASH_COMMANDS_HELP } from '@/lib/commands';
import { useCallback, useRef } from 'react';
import type { EditingMessage, ReplyPreview } from '@/types/chat';

interface MessageInputProps {
  value: string;
  onChange: (text: string) => void;
  onSend: () => void;
  onSendAttachment?: (file: File, caption?: string) => void;
  editingMessage?: EditingMessage | null;
  onCancelEdit?: () => void;
  replyingTo?: ReplyPreview | null;
  onCancelReply?: () => void;
  onTyping?: (isTyping: boolean) => void;
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
  replyingTo,
  onCancelReply,
  onTyping,
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
      if (e.key === 'Escape') {
        if (editingMessage) {
          e.preventDefault();
          onCancelEdit?.();
        } else if (replyingTo) {
          e.preventDefault();
          onCancelReply?.();
        }
      }
    },
    [onSend, editingMessage, onCancelEdit, replyingTo, onCancelReply],
  );

  const showSlashHints = !editingMessage && value.startsWith('/') && !value.includes(' ');

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
    <div className={cn('relative z-10 flex flex-col', className)}>
      {/* Slash command hints */}
      {showSlashHints && (
        <div className="pixel-panel bg-popover mx-3 mb-1 p-2 sm:mx-4">
          <p className="text-muted-foreground mb-1 font-mono text-[10px] font-bold uppercase">
            Slash Commands
          </p>
          <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {SLASH_COMMANDS_HELP.map((item) => (
              <button
                key={item.command}
                type="button"
                onClick={() => onChange(`${item.command.split(' ')[0]} `)}
                className="hover:bg-accent flex items-center justify-between gap-2 px-2 py-1 text-left font-mono text-xs"
              >
                <span className="font-bold text-[var(--unread)]">{item.command}</span>
                <span className="text-muted-foreground truncate text-[11px]">
                  {item.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reply mode banner */}
      {replyingTo && !editingMessage && (
        <div className="flex items-center gap-2 border-t-2 border-[#090c12] bg-[#232a42] px-3 py-2 sm:px-4">
          <div className="min-w-0 flex-1 border-l-2 border-[var(--unread)] pl-2">
            <p className="font-sans text-[11px] font-semibold tracking-wider text-[var(--unread)] uppercase">
              Replying to {replyingTo.senderName}
            </p>
            <p className="text-muted-foreground truncate font-sans text-xs">
              {replyingTo.content || 'Attachment'}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="pixel-btn bg-card text-foreground inline-flex size-7 shrink-0 items-center justify-center"
            aria-label="Cancel reply"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Edit mode banner */}
      {editingMessage && (
        <div className="flex items-center gap-2 border-t-2 border-[#090c12] bg-[#232a42] px-3 py-2 sm:px-4">
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

      <div className="flex items-center gap-2 border-t-2 border-[#090c12] bg-[#222847] p-3.5 shadow-[inset_0_2px_0_rgba(255,255,255,0.12)] sm:gap-2.5 sm:p-4">
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
              className="pixel-btn bg-secondary text-secondary-foreground inline-flex size-12 shrink-0 items-center justify-center border-[#090c12] disabled:opacity-50"
              aria-label="Attach file"
            >
              <PixelClipIcon className="size-6" />
            </button>
          </>
        )}

        <input
          type="text"
          placeholder={
            editingMessage
              ? 'Edit your message...'
              : 'Message... (try /roll 2d6, /me, /flip, /shrug)'
          }
          className="pixel-input placeholder:text-muted-foreground h-12 min-w-0 flex-1 rounded-none px-3.5 font-sans text-base outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            onTyping?.(e.target.value.trim().length > 0);
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-label="Message input"
        />

        <button
          type="button"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className={cn(
            'pixel-btn inline-flex size-12 shrink-0 items-center justify-center border-[#090c12] text-white disabled:opacity-75',
            editingMessage
              ? 'bg-[var(--unread)] text-[#090c12]'
              : 'bg-[#16a34a] shadow-[inset_0_3px_0_#6ee7b7,3px_3px_0_#07090e] hover:bg-[#22c55e] md:bg-[#3346cf] md:shadow-[inset_0_3px_0_#7687ff,3px_3px_0_#07090e] md:hover:bg-[#3f54e6]',
          )}
          aria-label={editingMessage ? 'Save edit' : 'Send message'}
        >
          <PixelSendIcon className="size-6" />
        </button>
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Pencil, Trash2, Download, FileIcon, X } from 'lucide-react';
import type { MessageWithSender } from '@/types/chat';
import type { Attachment } from '@/types/database';

interface MessageBubbleProps {
  message: MessageWithSender;
  variant: 'sent' | 'received';
  className?: string;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
}

const ALLOWED_ATTACHMENT_PROTOCOLS = new Set(['https:', 'http:', 'blob:']);

/**
 * Only allow attachment links with a scheme we know is safe to render.
 * Prevents `javascript:` / `data:` URLs from being used as links or images.
 */
function getSafeAttachmentUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    return ALLOWED_ATTACHMENT_PROTOCOLS.has(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentPreview({ attachment }: { attachment: Attachment }) {
  const isImage = attachment.file_type.startsWith('image/');
  const safeUrl = getSafeAttachmentUrl(attachment.file_url);

  if (isImage && safeUrl) {
    return (
      <a
        href={safeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block overflow-hidden rounded-lg"
      >
        <Image
          src={safeUrl}
          alt={attachment.file_name}
          width={320}
          height={240}
          unoptimized
          className="h-auto max-h-60 w-auto max-w-full rounded-lg object-cover transition-opacity hover:opacity-90"
        />
      </a>
    );
  }

  const fileSummary = (
    <>
      <div className="bg-background/20 flex size-10 shrink-0 items-center justify-center rounded-lg">
        <FileIcon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{attachment.file_name}</p>
        <p className="text-xs opacity-70">{formatFileSize(attachment.file_size)}</p>
      </div>
      <Download className="size-4 shrink-0 opacity-70" />
    </>
  );

  if (!safeUrl) {
    return (
      <div className="bg-background/10 flex items-center gap-3 rounded-lg p-3">
        {fileSummary}
      </div>
    );
  }

  return (
    <a
      href={safeUrl}
      target="_blank"
      rel="noopener noreferrer"
      download={attachment.file_name}
      className="bg-background/10 hover:bg-background/20 flex items-center gap-3 rounded-lg p-3 transition-colors"
    >
      {fileSummary}
    </a>
  );
}

function ImageLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;

    closeButtonRef.current?.focus();
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 text-white transition-opacity hover:opacity-70"
        aria-label="Close image preview"
      >
        <X className="size-6" />
      </button>
      <Image
        src={src}
        alt={alt}
        width={1200}
        height={800}
        unoptimized
        className="h-auto max-h-[90vh] w-auto max-w-full rounded-lg object-contain"
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
}

export function MessageBubble({
  message,
  variant,
  className,
  onEdit,
  onDelete,
}: MessageBubbleProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const isSent = variant === 'sent';
  const closeLightbox = useCallback(() => setLightboxSrc(null), []);

  // Deleted message
  if (message.is_deleted) {
    return (
      <div
        className={cn(
          'w-fit max-w-[75%] rounded-b-2xl px-3 py-2 sm:max-w-[60%]',
          isSent
            ? 'bg-primary/50 text-primary-foreground/60 rounded-tl-2xl'
            : 'bg-muted/50 text-muted-foreground rounded-tr-2xl',
          className,
        )}
      >
        <p className="text-sm italic">This message was deleted</p>
      </div>
    );
  }

  const hasAttachments = message.attachments && message.attachments.length > 0;
  const hasImageAttachment = message.attachments?.some((a) =>
    a.file_type.startsWith('image/'),
  );
  const canManage = isSent && (onEdit || onDelete);

  return (
    <>
      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} alt="Image preview" onClose={closeLightbox} />
      )}
      <div className="group relative">
        {/* Action menu (only for own messages).
            Visible on hover/focus for keyboards and always on small/touch screens. */}
        {canManage && (
          <div
            className={cn(
              'bg-popover absolute -top-1 right-full z-10 mr-1 flex items-center gap-0.5 rounded-md border p-0.5 shadow-sm transition-opacity',
              'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100',
              'group-focus-within:pointer-events-auto group-focus-within:opacity-100',
              'max-md:pointer-events-auto max-md:opacity-100',
            )}
          >
            {onEdit && message.type === 'text' && (
              <button
                type="button"
                onClick={() => onEdit(message.id, message.content || '')}
                className="hover:bg-accent inline-flex size-7 items-center justify-center rounded-sm transition-colors"
                title="Edit message"
                aria-label="Edit message"
              >
                <Pencil className="size-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(message.id)}
                className="hover:bg-destructive/10 text-destructive inline-flex size-7 items-center justify-center rounded-sm transition-colors"
                title="Delete message"
                aria-label="Delete message"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        )}

        <div
          data-variant={variant}
          className={cn(
            'w-fit max-w-[75%] rounded-b-2xl sm:max-w-[60%]',
            hasImageAttachment ? 'overflow-hidden p-1' : 'p-3',
            isSent
              ? 'bg-primary text-primary-foreground rounded-tl-2xl'
              : 'bg-muted text-foreground rounded-tr-2xl',
            className,
          )}
        >
          {/* Attachments */}
          {hasAttachments && (
            <div className="space-y-1">
              {message.attachments!.map((attachment) => {
                const safeUrl = getSafeAttachmentUrl(attachment.file_url);

                return attachment.file_type.startsWith('image/') && safeUrl ? (
                  <button
                    key={attachment.id}
                    type="button"
                    className="block cursor-zoom-in overflow-hidden rounded-xl"
                    onClick={() => setLightboxSrc(safeUrl)}
                    aria-label={`Preview ${attachment.file_name}`}
                  >
                    <Image
                      src={safeUrl}
                      alt={attachment.file_name}
                      width={320}
                      height={240}
                      unoptimized
                      className="h-auto max-h-60 w-auto max-w-full rounded-xl object-cover transition-opacity hover:opacity-90"
                    />
                  </button>
                ) : (
                  <AttachmentPreview key={attachment.id} attachment={attachment} />
                );
              })}
            </div>
          )}

          {/* Text content */}
          {message.content && (
            <div className={cn(hasImageAttachment && 'px-2 pt-2 pb-1')}>
              <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                {message.content}
              </p>
            </div>
          )}

          {/* Edited indicator */}
          {message.is_edited && (
            <p
              className={cn(
                'mt-0.5 text-[10px]',
                isSent ? 'text-primary-foreground/50' : 'text-muted-foreground',
                hasImageAttachment && 'px-2 pb-1',
              )}
            >
              (edited)
            </p>
          )}
        </div>
      </div>
    </>
  );
}

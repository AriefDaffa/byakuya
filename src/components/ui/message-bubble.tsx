'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Pencil, Trash2, X } from 'lucide-react';
import { PixelDownloadIcon, PixelFileIcon } from '@/components/ui/pixel-icons';
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
        className="block overflow-hidden"
      >
        <Image
          src={safeUrl}
          alt={attachment.file_name}
          width={320}
          height={240}
          unoptimized
          className="h-auto max-h-60 w-auto max-w-full object-cover transition-opacity hover:opacity-90"
        />
      </a>
    );
  }

  return (
    <div className="flex max-w-full min-w-[220px] items-center gap-3 border-2 border-[var(--pixel-frame)] bg-black/15 px-3 py-2 dark:bg-black/25">
      <PixelFileIcon className="size-8 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{attachment.file_name}</p>
        <p className="font-pixel-mono text-[10px] opacity-75">
          {formatFileSize(attachment.file_size)}
        </p>
      </div>
      {safeUrl && (
        <a
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
          download={attachment.file_name}
          className="pixel-btn shrink-0 p-1.5"
          aria-label={`Download ${attachment.file_name}`}
          title={`Download ${attachment.file_name}`}
        >
          <PixelDownloadIcon className="size-4" />
        </a>
      )}
    </div>
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
      <div className={cn('flex w-full', isSent ? 'justify-end' : 'justify-start')}>
        <div
          data-variant={variant}
          className={cn(
            'w-fit max-w-[78%] rounded-none px-3.5 py-2.5 sm:max-w-[68%]',
            isSent ? 'pixel-bubble-sent opacity-70' : 'pixel-bubble-received opacity-80',
            className,
          )}
        >
          <p className="text-sm italic">This message was deleted</p>
        </div>
      </div>
    );
  }

  const attachments = message.attachments ?? [];
  const hasAttachments = attachments.length > 0;
  const canManage = isSent && Boolean(onEdit || onDelete);
  // Attachments already show the filename, so avoid repeating it as body text.
  const isDuplicateAttachmentName =
    hasAttachments &&
    attachments.some((attachment) => attachment.file_name === message.content);
  const showTextContent = Boolean(message.content) && !isDuplicateAttachmentName;

  return (
    <>
      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} alt="Image preview" onClose={closeLightbox} />
      )}
      <div
        className={cn(
          'group flex w-full items-end gap-1.5',
          isSent ? 'justify-end' : 'justify-start',
        )}
      >
        {/* Action menu (only for own messages). Kept outside the bubble so short
            messages keep their natural width. Visible on hover/focus for
            keyboards and always on small/touch screens. */}
        {canManage && (
          <div
            className={cn(
              'flex shrink-0 items-center gap-0.5 transition-opacity',
              'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100',
              'group-focus-within:pointer-events-auto group-focus-within:opacity-100',
              'max-md:pointer-events-auto max-md:opacity-100',
            )}
          >
            {onEdit && message.type === 'text' && (
              <button
                type="button"
                onClick={() => onEdit(message.id, message.content || '')}
                className="pixel-btn bg-card inline-flex size-7 items-center justify-center rounded-none"
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
                className="pixel-btn bg-card text-destructive inline-flex size-7 items-center justify-center rounded-none"
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
            'w-fit max-w-[78%] min-w-0 rounded-none px-3.5 py-2.5 sm:max-w-[68%]',
            isSent ? 'pixel-bubble-sent' : 'pixel-bubble-received',
            className,
          )}
        >
          {/* Attachments */}
          {hasAttachments && (
            <div className={cn('flex flex-col gap-2', showTextContent && 'mb-2')}>
              {attachments.map((attachment) => {
                const safeUrl = getSafeAttachmentUrl(attachment.file_url);

                return attachment.file_type.startsWith('image/') && safeUrl ? (
                  <button
                    key={attachment.id}
                    type="button"
                    className="block cursor-zoom-in overflow-hidden"
                    onClick={() => setLightboxSrc(safeUrl)}
                    aria-label={`Preview ${attachment.file_name}`}
                  >
                    <Image
                      src={safeUrl}
                      alt={attachment.file_name}
                      width={320}
                      height={240}
                      unoptimized
                      className="h-auto max-h-60 w-auto max-w-full object-cover transition-opacity hover:opacity-90"
                    />
                  </button>
                ) : (
                  <AttachmentPreview key={attachment.id} attachment={attachment} />
                );
              })}
            </div>
          )}

          {/* Text content */}
          {showTextContent && (
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
              {message.content}
            </p>
          )}

          {/* Edited indicator */}
          {message.is_edited && (
            <p className="font-pixel-mono mt-1 text-[10px] opacity-75">(edited)</p>
          )}
        </div>
      </div>
    </>
  );
}

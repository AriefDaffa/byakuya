'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Pencil, Trash2, X } from 'lucide-react';
import { PixelDownloadIcon, PixelFileIcon } from '@/components/ui/pixel-icons';
import { formatChatTimestamp } from '@/lib/format';
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
 * Attachments either point at an absolute URL (https:, http:, blob:) or at a
 * relative app path such as `/api/attachments/<id>`. Everything else, notably
 * `javascript:` / `data:` payloads and protocol-relative `//host` links, is
 * rejected.
 */
export function isSafeAttachmentUrl(url: string): boolean {
  const trimmed = url.trim();

  if (!trimmed) return false;
  // `//evil.example` and backslash variants would navigate off-site.
  if (trimmed.startsWith('//') || trimmed.startsWith('/\\') || trimmed.startsWith('\\')) {
    return false;
  }
  // Relative app paths (e.g. /api/attachments/123) are always same-origin.
  if (trimmed.startsWith('/')) return true;

  try {
    const parsed = new URL(trimmed);
    return ALLOWED_ATTACHMENT_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

function getSafeAttachmentUrl(url: string): string | null {
  const trimmed = url.trim();
  return isSafeAttachmentUrl(trimmed) ? trimmed : null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Prominent, always-visible download affordance used by every attachment. */
function AttachmentDownloadLink({
  attachment,
  url,
}: {
  attachment: Attachment;
  url: string;
}) {
  return (
    <a
      href={url}
      download={attachment.file_name}
      className="pixel-btn inline-flex size-10 shrink-0 items-center justify-center bg-[#1e2638] text-[#f8fafc] hover:bg-[#2b3650]"
      aria-label={`Download ${attachment.file_name}`}
      title={`Download ${attachment.file_name}`}
    >
      <PixelDownloadIcon className="size-5" />
    </a>
  );
}

/**
 * Non-image attachments sit directly on the bubble surface (single surface —
 * no nested card border) so the bubble reads like R01/R02.
 */
function AttachmentCard({ attachment }: { attachment: Attachment }) {
  const safeUrl = getSafeAttachmentUrl(attachment.file_url);

  return (
    <div className="flex w-full max-w-full min-w-[240px] items-center gap-3">
      <PixelFileIcon className="size-10 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-sans text-[15px] font-semibold text-current">
          {attachment.file_name}
        </p>
        <p className="font-mono text-xs tabular-nums opacity-75">
          {formatFileSize(attachment.file_size)}
        </p>
      </div>
      {safeUrl && <AttachmentDownloadLink attachment={attachment} url={safeUrl} />}
    </div>
  );
}

/** Image attachments show a thumbnail plus the same file/download footer. */
function ImageAttachmentCard({
  attachment,
  onPreview,
}: {
  attachment: Attachment;
  onPreview: (src: string) => void;
}) {
  const safeUrl = getSafeAttachmentUrl(attachment.file_url);

  return (
    <div className="flex w-full max-w-full min-w-[240px] flex-col gap-2">
      {safeUrl && (
        <button
          type="button"
          className="block cursor-zoom-in overflow-hidden"
          onClick={() => onPreview(safeUrl)}
          aria-label={`Preview ${attachment.file_name}`}
        >
          <Image
            src={safeUrl}
            alt={attachment.file_name}
            width={320}
            height={240}
            unoptimized
            className="h-auto max-h-60 w-full object-cover transition-opacity hover:opacity-90"
          />
        </button>
      )}
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-medium text-current">
            {attachment.file_name}
          </p>
          <p className="font-mono text-xs tabular-nums opacity-75">
            {formatFileSize(attachment.file_size)}
          </p>
        </div>
        {safeUrl && <AttachmentDownloadLink attachment={attachment} url={safeUrl} />}
      </div>
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

/** Bottom-right meta line shown inside every bubble (edited flag + timestamp). */
function BubbleMeta({ message }: { message: MessageWithSender }) {
  const timestamp = formatChatTimestamp(message.created_at);

  if (!message.is_edited && !timestamp) return null;

  return (
    <span className="ml-auto shrink-0 self-end font-mono text-xs leading-none tabular-nums opacity-80">
      {message.is_edited && <span className="mr-1.5">(edited)</span>}
      {timestamp}
    </span>
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
            'flex w-fit max-w-[78%] flex-col gap-1 rounded-none px-4 py-3 sm:max-w-[68%]',
            isSent ? 'pixel-bubble-sent opacity-70' : 'pixel-bubble-received opacity-80',
            className,
          )}
        >
          <p className="font-sans text-base leading-snug italic opacity-90">
            This message was deleted
          </p>
          <BubbleMeta message={message} />
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
          'group flex w-full items-end gap-2',
          isSent ? 'justify-end' : 'justify-start',
        )}
      >
        {/* Action menu (only for own messages). Kept outside the bubble so short
            messages keep their natural width. Hidden at rest so the feed stays
            clean; revealed on hover or keyboard focus. */}
        {canManage && (
          <div
            className={cn(
              'flex shrink-0 items-center gap-0.5 transition-opacity duration-150',
              'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100',
              'group-focus-within:pointer-events-auto group-focus-within:opacity-100',
            )}
          >
            {onEdit && message.type === 'text' && (
              <button
                type="button"
                onClick={() => onEdit(message.id, message.content || '')}
                className="pixel-btn bg-card inline-flex size-8 shrink-0 items-center justify-center rounded-none"
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
                className="pixel-btn bg-card text-destructive inline-flex size-8 shrink-0 items-center justify-center rounded-none"
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
            'w-fit max-w-[78%] min-w-0 rounded-none px-4 py-3 sm:max-w-[68%]',
            isSent ? 'pixel-bubble-sent' : 'pixel-bubble-received',
            className,
          )}
        >
          <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
            {/* Attachments */}
            {hasAttachments && (
              <div className="flex w-full flex-col gap-2">
                {attachments.map((attachment) =>
                  attachment.file_type.startsWith('image/') ? (
                    <ImageAttachmentCard
                      key={attachment.id}
                      attachment={attachment}
                      onPreview={setLightboxSrc}
                    />
                  ) : (
                    <AttachmentCard key={attachment.id} attachment={attachment} />
                  ),
                )}
              </div>
            )}

            {/* Text content */}
            {showTextContent && (
              <p className="max-w-full font-sans text-[17px] leading-snug font-medium break-words whitespace-pre-wrap sm:text-[18px]">
                {message.content}
              </p>
            )}

            {/* Edited flag + timestamp, bottom-right inside the bubble */}
            <BubbleMeta message={message} />
          </div>
        </div>
      </div>
    </>
  );
}

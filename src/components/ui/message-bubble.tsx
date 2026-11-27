'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Pencil, Pin, Reply, SmilePlus, Trash2, X } from 'lucide-react';
import { PixelDownloadIcon, PixelFileIcon } from '@/components/ui/pixel-icons';
import { PIXEL_EMOTE_OPTIONS } from '@/features/chat/schemas';
import { formatChatTimestamp } from '@/lib/format';
import type { MessageWithSender } from '@/types/chat';
import type { Attachment } from '@/types/database';

interface MessageBubbleProps {
  message: MessageWithSender;
  variant: 'sent' | 'received';
  currentUserId?: string;
  showSenderName?: boolean;
  isHighlighted?: boolean;
  className?: string;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onReply?: (message: MessageWithSender) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onPin?: (messageId: string) => void;
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
  currentUserId,
  showSenderName = false,
  isHighlighted = false,
  className,
  onEdit,
  onDelete,
  onReply,
  onReact,
  onPin,
}: MessageBubbleProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const isSent = variant === 'sent';
  const closeLightbox = useCallback(() => setLightboxSrc(null), []);

  // System / slash-command action messages
  if (message.type === 'system' && !message.is_deleted) {
    return (
      <div
        id={`msg-${message.id}`}
        className={cn(
          'my-1 flex w-full justify-center',
          isHighlighted && 'ring-2 ring-[var(--unread)]',
        )}
      >
        <div className="pixel-box bg-card/90 text-foreground max-w-[85%] px-3 py-1.5 text-center font-mono text-xs">
          <span>{message.content}</span>
          <span className="ml-2 opacity-60">
            {formatChatTimestamp(message.created_at)}
          </span>
        </div>
      </div>
    );
  }

  // Deleted message
  if (message.is_deleted) {
    return (
      <div
        id={`msg-${message.id}`}
        className={cn('flex w-full', isSent ? 'justify-end' : 'justify-start')}
      >
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
  const hasActions = canManage || Boolean(onReply || onReact || onPin);
  const reactions = message.reactions ?? [];
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
        id={`msg-${message.id}`}
        className={cn(
          'group flex w-full flex-col gap-1',
          isSent ? 'items-end' : 'items-start',
        )}
      >
        <div
          className={cn(
            'flex w-full items-end gap-2',
            isSent ? 'flex-row justify-end' : 'flex-row-reverse justify-end',
          )}
        >
          {/* Action menu. Kept outside the bubble so short messages keep their natural width. */}
          {hasActions && (
            <div
              className={cn(
                'relative flex shrink-0 items-center gap-0.5 transition-opacity duration-150',
                pickerOpen
                  ? 'pointer-events-auto opacity-100'
                  : 'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100',
              )}
            >
              {onReact && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setPickerOpen((prev) => !prev)}
                    className="pixel-btn bg-card inline-flex size-8 shrink-0 items-center justify-center rounded-none"
                    title="React"
                    aria-label="Add reaction"
                  >
                    <SmilePlus className="size-3.5" />
                  </button>
                  {pickerOpen && (
                    <div className="pixel-panel bg-popover absolute bottom-9 left-0 z-30 flex items-center gap-1 p-1">
                      {PIXEL_EMOTE_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            onReact(message.id, emoji);
                            setPickerOpen(false);
                          }}
                          className="hover:bg-accent inline-flex size-7 items-center justify-center text-sm"
                          aria-label={`React with ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {onReply && (
                <button
                  type="button"
                  onClick={() => onReply(message)}
                  className="pixel-btn bg-card inline-flex size-8 shrink-0 items-center justify-center rounded-none"
                  title="Reply"
                  aria-label="Reply to message"
                >
                  <Reply className="size-3.5" />
                </button>
              )}
              {onPin && (
                <button
                  type="button"
                  onClick={() => onPin(message.id)}
                  className={cn(
                    'pixel-btn bg-card inline-flex size-8 shrink-0 items-center justify-center rounded-none',
                    message.is_pinned && 'text-[var(--unread)]',
                  )}
                  title={message.is_pinned ? 'Unpin message' : 'Pin message'}
                  aria-label={message.is_pinned ? 'Unpin message' : 'Pin message'}
                >
                  <Pin className="size-3.5" />
                </button>
              )}
              {canManage && onEdit && message.type === 'text' && (
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
              {canManage && onDelete && (
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
              isHighlighted && 'ring-2 ring-[var(--unread)]',
              className,
            )}
          >
            {showSenderName && !isSent && message.sender?.name && (
              <p className="mb-1 font-mono text-[11px] font-bold text-[var(--unread)]">
                {message.sender.name}
              </p>
            )}

            {message.is_pinned && (
              <div className="mb-1 flex items-center gap-1 font-mono text-[10px] font-bold uppercase opacity-80">
                <Pin className="size-3" /> Pinned
              </div>
            )}

            {message.replyTo && (
              <div className="mb-2 border-l-2 border-[var(--unread)] bg-black/20 px-2.5 py-1 text-xs">
                <p className="font-mono text-[10px] font-bold text-[var(--unread)]">
                  {message.replyTo.senderName}
                </p>
                <p className="truncate opacity-85">
                  {message.replyTo.isDeleted
                    ? 'Message deleted'
                    : message.replyTo.content || 'Attachment'}
                </p>
              </div>
            )}

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

        {/* Reaction pills */}
        {reactions.length > 0 && (
          <div className={cn('flex flex-wrap gap-1', isSent ? 'justify-end' : 'justify-start')}>
            {reactions.map((reaction) => {
              const reactedByMe =
                Boolean(currentUserId) && reaction.userIds.includes(currentUserId!);
              return (
                <button
                  key={reaction.emoji}
                  type="button"
                  onClick={() => onReact?.(message.id, reaction.emoji)}
                  className={cn(
                    'pixel-box inline-flex items-center gap-1 px-1.5 py-0.5 font-mono text-xs',
                    reactedByMe
                      ? 'bg-[#2c3766] text-[#f8fafc] ring-1 ring-[var(--unread)]'
                      : 'bg-card text-foreground',
                  )}
                  aria-label={`Toggle ${reaction.emoji} reaction (${reaction.userIds.length})`}
                >
                  <span>{reaction.emoji}</span>
                  <span className="tabular-nums">{reaction.userIds.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

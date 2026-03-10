'use client';

import { useState } from 'react';
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentPreview({ attachment }: { attachment: Attachment }) {
  const isImage = attachment.file_type.startsWith('image/');

  if (isImage) {
    return (
      <a
        href={attachment.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block overflow-hidden rounded-lg"
      >
        <img
          src={attachment.file_url}
          alt={attachment.file_name}
          className="max-h-60 max-w-full rounded-lg object-cover transition-opacity hover:opacity-90"
          loading="lazy"
        />
      </a>
    );
  }

  return (
    <a
      href={attachment.file_url}
      target="_blank"
      rel="noopener noreferrer"
      download={attachment.file_name}
      className="bg-background/10 hover:bg-background/20 flex items-center gap-3 rounded-lg p-3 transition-colors"
    >
      <div className="bg-background/20 flex size-10 shrink-0 items-center justify-center rounded-lg">
        <FileIcon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{attachment.file_name}</p>
        <p className="text-xs opacity-70">{formatFileSize(attachment.file_size)}</p>
      </div>
      <Download className="size-4 shrink-0 opacity-70" />
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
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-white/70"
      >
        <X className="size-6" />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
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
  const [showActions, setShowActions] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const isSent = variant === 'sent';

  // Deleted message
  if (message.is_deleted) {
    return (
      <div
        className={cn(
          'w-fit max-w-[50vh] rounded-b-2xl px-3 py-2',
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

  return (
    <>
      {lightboxSrc && (
        <ImageLightbox
          src={lightboxSrc}
          alt="Image preview"
          onClose={() => setLightboxSrc(null)}
        />
      )}
      <div
        className="group relative"
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Action menu (only for own messages) */}
        {isSent && showActions && (onEdit || onDelete) && (
          <div
            className={cn(
              'bg-popover absolute -top-1 z-10 flex items-center gap-0.5 rounded-md border p-0.5 shadow-sm',
              'right-full mr-1',
            )}
          >
            {onEdit && message.type === 'text' && (
              <button
                type="button"
                onClick={() => onEdit(message.id, message.content || '')}
                className="hover:bg-accent inline-flex size-7 items-center justify-center rounded-sm transition-colors"
                title="Edit message"
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
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        )}

        <div
          className={cn(
            'w-fit max-w-[50vh] rounded-b-2xl',
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
              {message.attachments!.map((attachment) =>
                attachment.file_type.startsWith('image/') ? (
                  <button
                    key={attachment.id}
                    type="button"
                    className="block cursor-zoom-in overflow-hidden rounded-xl"
                    onClick={() => setLightboxSrc(attachment.file_url)}
                  >
                    <img
                      src={attachment.file_url}
                      alt={attachment.file_name}
                      className="max-h-60 max-w-full rounded-xl object-cover transition-opacity hover:opacity-90"
                      loading="lazy"
                    />
                  </button>
                ) : (
                  <AttachmentPreview key={attachment.id} attachment={attachment} />
                ),
              )}
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

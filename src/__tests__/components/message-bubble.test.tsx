import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MessageBubble, isSafeAttachmentUrl } from '@/components/ui/message-bubble';
import { formatChatTimestamp } from '@/lib/format';
import type { MessageWithSender } from '@/types/chat';
import type { Attachment, Profile } from '@/types/database';

const sender: Profile = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  avatar_url: null,
  status: 'online',
  last_seen: null,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

function createMessage(overrides: Partial<MessageWithSender> = {}): MessageWithSender {
  return {
    id: 'message-1',
    conversation_id: 'conversation-1',
    sender_id: sender.id,
    content: 'Hello!',
    type: 'text',
    is_edited: false,
    is_deleted: false,
    reply_to_id: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    sender,
    attachments: [],
    ...overrides,
  };
}

function createAttachment(overrides: Partial<Attachment> = {}): Attachment {
  return {
    id: 'attachment-1',
    message_id: 'message-1',
    file_name: 'note.txt',
    file_type: 'text/plain',
    file_size: 43,
    file_url: 'https://example.com/note.txt',
    storage_path: 'attachments/note.txt',
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('isSafeAttachmentUrl', () => {
  it('accepts relative app paths and allowed absolute schemes', () => {
    expect(isSafeAttachmentUrl('/api/attachments/123')).toBe(true);
    expect(isSafeAttachmentUrl('https://example.com/note.txt')).toBe(true);
    expect(isSafeAttachmentUrl('http://example.com/note.txt')).toBe(true);
    expect(isSafeAttachmentUrl('blob:https://example.com/123')).toBe(true);
  });

  it('rejects unsafe and protocol-relative URLs', () => {
    expect(isSafeAttachmentUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeAttachmentUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isSafeAttachmentUrl('//evil.example/note.txt')).toBe(false);
    expect(isSafeAttachmentUrl('')).toBe(false);
  });
});

describe('MessageBubble', () => {
  it('renders sent variant with pixel bubble styling and comfortable text', () => {
    render(<MessageBubble message={createMessage()} variant="sent" />);

    const text = screen.getByText('Hello!');
    expect(text).toBeInTheDocument();
    expect(text.className).toContain('text-base');
    expect(text.className).toContain('leading-snug');
    expect(text.className).toContain('font-sans');

    const bubble = text.closest('[data-variant="sent"]');
    expect(bubble).not.toBeNull();
    expect(bubble?.className).toContain('pixel-bubble-sent');
    expect(bubble?.className).toContain('rounded-none');
    expect(bubble?.className).toContain('max-w-[78%]');
    expect(bubble?.className).toContain('px-4');
    expect(bubble?.className).toContain('py-3');
  });

  it('renders received variant with pixel bubble styling', () => {
    render(
      <MessageBubble
        message={createMessage({ id: 'message-2', content: 'Hi there!' })}
        variant="received"
      />,
    );

    const text = screen.getByText('Hi there!');
    expect(text).toBeInTheDocument();

    const bubble = text.closest('[data-variant="received"]');
    expect(bubble).not.toBeNull();
    expect(bubble?.className).toContain('pixel-bubble-received');
    expect(bubble?.className).toContain('rounded-none');
    expect(bubble?.className).toContain('px-4');
    expect(bubble?.className).toContain('py-3');
  });

  it('renders the timestamp inside the bottom-right of the bubble', () => {
    const message = createMessage();
    render(<MessageBubble message={message} variant="sent" />);

    const bubble = screen.getByText('Hello!').closest('[data-variant="sent"]');
    expect(bubble).not.toBeNull();

    const timestamp = formatChatTimestamp(message.created_at);
    expect(timestamp).toBeTruthy();

    const meta = within(bubble as HTMLElement).getByText(timestamp as string);
    expect(meta).toBeInTheDocument();
    expect(bubble?.contains(meta)).toBe(true);
    expect(meta.className).toContain('ml-auto');
    expect(meta.className).toContain('font-mono');
    expect(meta.className).toContain('text-xs');
    expect(meta.className).toContain('tabular-nums');
    expect(meta.className).toContain('opacity-75');
  });

  it('renders the edited indicator next to the internal timestamp', () => {
    const message = createMessage({ content: 'Updated text', is_edited: true });
    render(<MessageBubble message={message} variant="sent" />);

    const bubble = screen.getByText('Updated text').closest('[data-variant="sent"]');
    expect(bubble).not.toBeNull();

    const edited = within(bubble as HTMLElement).getByText('(edited)');
    expect(bubble?.contains(edited)).toBe(true);

    const timestamp = formatChatTimestamp(message.created_at) as string;
    expect(within(bubble as HTMLElement).getByText(timestamp)).toBeInTheDocument();
  });

  it('hides message actions at rest but reveals them on hover or keyboard focus', () => {
    render(
      <MessageBubble
        message={createMessage()}
        variant="sent"
        onEdit={() => {}}
        onDelete={() => {}}
      />,
    );

    const bubble = screen.getByText('Hello!').closest('[data-variant="sent"]');
    const editButton = screen.getByRole('button', { name: 'Edit message' });
    const deleteButton = screen.getByRole('button', { name: 'Delete message' });

    expect(bubble?.contains(editButton)).toBe(false);
    expect(bubble?.contains(deleteButton)).toBe(false);

    const actions = editButton.parentElement;
    expect(actions).not.toBeNull();
    expect(actions?.className).toContain('opacity-0');
    expect(actions?.className).toContain('group-hover:opacity-100');
    expect(actions?.className).toContain('group-focus-within:opacity-100');
    expect(actions?.className).toContain('transition-opacity');
    expect(actions?.className).not.toContain('max-md:opacity-100');
  });

  it('renders a single-surface attachment bubble with filename, size, and a prominent download link', () => {
    render(
      <MessageBubble
        message={createMessage({
          content: 'Here is the file',
          attachments: [createAttachment()],
        })}
        variant="sent"
      />,
    );

    expect(screen.getAllByText('note.txt')).toHaveLength(1);
    const size = screen.getByText('43 B');
    expect(size).toBeInTheDocument();
    expect(size.className).toContain('font-mono');
    expect(size.className).toContain('tabular-nums');

    const card = size.parentElement?.parentElement;
    expect(card).not.toBeNull();
    expect(card?.className).toContain('min-w-[240px]');
    // Single surface: the attachment row must not add its own nested frame.
    expect(card?.className).not.toContain('border-2');
    expect(card?.className).not.toContain('bg-black/20');
    expect(card?.closest('[data-variant="sent"]')).not.toBeNull();

    const download = screen.getByRole('link', { name: 'Download note.txt' });
    expect(download).toBeInTheDocument();
    expect(download.getAttribute('href')).toBe('https://example.com/note.txt');
    expect(download.getAttribute('download')).toBe('note.txt');
    expect(download.className).toContain('pixel-btn');
    expect(download.className).toContain('size-10');
    expect(download.className).toContain('bg-[#1e2638]');
    expect(download.className).toContain('text-[#f8fafc]');
    expect(download.className).toContain('hover:bg-[#2b3650]');

    expect(screen.getByText('Here is the file')).toBeInTheDocument();
  });

  it('renders the download link for relative /api/attachments URLs', () => {
    render(
      <MessageBubble
        message={createMessage({
          content: '',
          attachments: [createAttachment({ file_url: '/api/attachments/123' })],
        })}
        variant="received"
      />,
    );

    const download = screen.getByRole('link', { name: 'Download note.txt' });
    expect(download).toBeInTheDocument();
    expect(download.getAttribute('href')).toBe('/api/attachments/123');
    expect(download.getAttribute('download')).toBe('note.txt');
  });

  it('renders the download link for image attachments too', () => {
    render(
      <MessageBubble
        message={createMessage({
          content: '',
          attachments: [
            createAttachment({
              file_name: 'sprite.png',
              file_type: 'image/png',
              file_url: 'https://example.com/sprite.png',
              file_size: 2048,
            }),
          ],
        })}
        variant="received"
      />,
    );

    expect(screen.getByRole('link', { name: 'Download sprite.png' })).toBeInTheDocument();
    expect(screen.getByText('sprite.png')).toBeInTheDocument();
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
  });

  it('omits the download link when the attachment URL is unsafe', () => {
    render(
      <MessageBubble
        message={createMessage({
          content: 'Suspicious file',
          attachments: [
            createAttachment({ file_url: 'javascript:alert(1)' }),
            createAttachment({
              id: 'attachment-2',
              file_name: 'remote.txt',
              file_url: '//evil.example/remote.txt',
            }),
          ],
        })}
        variant="sent"
      />,
    );

    expect(screen.queryByRole('link', { name: /Download/ })).toBeNull();
  });

  it('does not repeat the attachment filename as message text', () => {
    render(
      <MessageBubble
        message={createMessage({
          content: 'note.txt',
          attachments: [createAttachment()],
        })}
        variant="sent"
      />,
    );

    expect(screen.getAllByText('note.txt')).toHaveLength(1);
  });

  it('renders the deleted placeholder for deleted messages', () => {
    render(
      <MessageBubble
        message={createMessage({
          id: 'message-3',
          content: null,
          is_deleted: true,
        })}
        variant="sent"
      />,
    );

    expect(screen.getByText('This message was deleted')).toBeInTheDocument();
  });
});

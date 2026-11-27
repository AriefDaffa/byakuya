import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble } from '@/components/ui/message-bubble';
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

describe('MessageBubble', () => {
  it('renders sent variant with pixel bubble styling', () => {
    render(<MessageBubble message={createMessage()} variant="sent" />);

    const text = screen.getByText('Hello!');
    expect(text).toBeInTheDocument();

    const bubble = text.closest('[data-variant="sent"]');
    expect(bubble).not.toBeNull();
    expect(bubble?.className).toContain('pixel-bubble-sent');
    expect(bubble?.className).toContain('rounded-none');
    expect(bubble?.className).toContain('max-w-[78%]');
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
  });

  it('keeps the message actions outside the bubble element', () => {
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
  });

  it('renders a single attachment card with filename, size, and download link', () => {
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
    expect(screen.getByText('43 B')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Download note.txt' })).toBeInTheDocument();
    expect(screen.getByText('Here is the file')).toBeInTheDocument();
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

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble } from '@/components/ui/message-bubble';
import type { MessageWithSender } from '@/types/chat';
import type { Profile } from '@/types/database';

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

describe('MessageBubble', () => {
  it('renders sent variant', () => {
    render(<MessageBubble message={createMessage()} variant="sent" />);

    const text = screen.getByText('Hello!');
    expect(text).toBeInTheDocument();

    const bubble = text.closest('[data-variant="sent"]');
    expect(bubble).not.toBeNull();
    expect(bubble?.className).toContain('bg-primary');
  });

  it('renders received variant', () => {
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
    expect(bubble?.className).toContain('bg-muted');
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

import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageBubble } from '@/components/ui/message-bubble';
import type { MessageWithSender } from '@/types/chat';

function makeMessage(overrides: Partial<MessageWithSender> = {}): MessageWithSender {
  return {
    id: 'msg-1',
    conversation_id: 'conv-1',
    sender_id: 'user-1',
    content: 'Hello pixel world',
    type: 'text',
    is_edited: false,
    is_deleted: false,
    is_pinned: false,
    reply_to_id: null,
    created_at: '2026-01-01T12:00:00.000Z',
    updated_at: '2026-01-01T12:00:00.000Z',
    sender: {
      id: 'user-1',
      name: 'Byakuya',
      email: 'byakuya@example.com',
      avatar_url: null,
      status: 'online',
      last_seen: null,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
    ...overrides,
  };
}

describe('MessageBubble new features', () => {
  it('renders system/slash-command messages as centered banners', () => {
    const msg = makeMessage({
      type: 'system',
      content: '* Byakuya flipped a coin: HEADS',
    });
    render(<MessageBubble message={msg} variant="sent" />);
    expect(screen.getByText('* Byakuya flipped a coin: HEADS')).toBeInTheDocument();
  });

  it('renders replyTo quote preview and pinned badge', () => {
    const msg = makeMessage({
      is_pinned: true,
      replyTo: {
        id: 'msg-0',
        senderId: 'user-2',
        senderName: 'Renji',
        content: 'Original message',
        isDeleted: false,
      },
    });
    render(<MessageBubble message={msg} variant="received" showSenderName />);
    expect(screen.getByText('Pinned')).toBeInTheDocument();
    expect(screen.getByText('Renji')).toBeInTheDocument();
    expect(screen.getByText('Original message')).toBeInTheDocument();
  });

  it('renders reaction pills and triggers onReact when clicked', () => {
    const onReact = vi.fn();
    const msg = makeMessage({
      reactions: [{ emoji: '🔥', userIds: ['user-1', 'user-2'] }],
    });
    render(
      <MessageBubble
        message={msg}
        variant="sent"
        currentUserId="user-1"
        onReact={onReact}
      />,
    );
    const pill = screen.getByRole('button', { name: /Toggle 🔥 reaction \(2\)/i });
    fireEvent.click(pill);
    expect(onReact).toHaveBeenCalledWith('msg-1', '🔥');
  });
});

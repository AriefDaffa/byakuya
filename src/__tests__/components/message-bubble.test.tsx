import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble } from '@/components/ui/message-bubble';

describe('MessageBubble', () => {
  it('renders sent variant', () => {
    render(<MessageBubble variant="sent">Hello!</MessageBubble>);
    const bubble = screen.getByText('Hello!');
    expect(bubble).toBeInTheDocument();
    expect(bubble.className).toContain('bg-primary');
  });

  it('renders received variant', () => {
    render(<MessageBubble variant="received">Hi there!</MessageBubble>);
    const bubble = screen.getByText('Hi there!');
    expect(bubble).toBeInTheDocument();
    expect(bubble.className).toContain('bg-muted');
  });
});

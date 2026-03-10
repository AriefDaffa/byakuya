import { describe, it, expect } from 'vitest';
import { formatChatTimestamp, formatTime } from '@/lib/format';

describe('formatChatTimestamp', () => {
  it('returns undefined for empty string', () => {
    expect(formatChatTimestamp('')).toBeUndefined();
  });

  it('returns time for today', () => {
    const now = new Date().toISOString();
    const result = formatChatTimestamp(now);
    expect(result).toBeDefined();
    expect(result).toMatch(/\d{1,2}:\d{2}\s(AM|PM)/);
  });

  it('returns "Yesterday" for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const result = formatChatTimestamp(yesterday.toISOString());
    expect(result).toBe('Yesterday');
  });
});

describe('formatTime', () => {
  it('formats date to time string', () => {
    const result = formatTime(new Date('2025-03-10T14:30:00'));
    expect(result).toMatch(/\d{2}:\d{2}\s(AM|PM)/);
  });
});

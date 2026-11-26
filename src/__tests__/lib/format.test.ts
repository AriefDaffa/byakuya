import { describe, it, expect } from 'vitest';
import {
  formatChatListTime,
  formatChatTimestamp,
  formatMessageDate,
  formatTime,
} from '@/lib/format';

describe('formatChatTimestamp', () => {
  it('returns undefined for empty string', () => {
    expect(formatChatTimestamp('')).toBeUndefined();
  });

  it('returns undefined for invalid date strings', () => {
    expect(formatChatTimestamp('not-a-date')).toBeUndefined();
    expect(formatChatTimestamp('2025-13-45')).toBeUndefined();
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

describe('formatChatListTime', () => {
  it('delegates to formatChatTimestamp', () => {
    const now = new Date().toISOString();
    expect(formatChatListTime(now)).toBe(formatChatTimestamp(now));
  });

  it('returns undefined for invalid date strings', () => {
    expect(formatChatListTime('invalid')).toBeUndefined();
  });
});

describe('formatMessageDate', () => {
  it('returns "Today" for today', () => {
    expect(formatMessageDate(new Date().toISOString())).toBe('Today');
  });

  it('returns "Yesterday" for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(formatMessageDate(yesterday.toISOString())).toBe('Yesterday');
  });

  it('formats older dates', () => {
    expect(formatMessageDate('2025-03-10T14:30:00')).toMatch(/Mar\s10,\s2025/);
  });

  it('returns undefined for invalid date strings', () => {
    expect(formatMessageDate('')).toBeUndefined();
    expect(formatMessageDate('not-a-date')).toBeUndefined();
  });
});

describe('formatTime', () => {
  it('formats date to time string', () => {
    const result = formatTime(new Date('2025-03-10T14:30:00'));
    expect(result).toMatch(/\d{2}:\d{2}\s(AM|PM)/);
  });

  it('never throws for invalid dates', () => {
    expect(formatTime('not-a-date')).toBe('');
    expect(formatTime(new Date('invalid'))).toBe('');
  });
});

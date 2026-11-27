import { describe, expect, it } from 'vitest';
import { parseSlashCommand } from '@/lib/commands';

describe('parseSlashCommand', () => {
  it('returns null for normal messages', () => {
    expect(parseSlashCommand('hello world', 'Alice')).toBeNull();
    expect(parseSlashCommand('/unknown command', 'Alice')).toBeNull();
  });

  it('parses /flip deterministically with custom rng', () => {
    expect(parseSlashCommand('/flip', 'Alice', () => 0.1)).toEqual({
      type: 'system',
      content: '* Alice flipped a coin: HEADS',
    });
    expect(parseSlashCommand('/flip', 'Alice', () => 0.9)).toEqual({
      type: 'system',
      content: '* Alice flipped a coin: TAILS',
    });
  });

  it('parses /me action', () => {
    expect(parseSlashCommand('/me waves hello', 'Alice')).toEqual({
      type: 'system',
      content: '* Alice waves hello',
    });
    expect(parseSlashCommand('/me', 'Alice')).toBeNull();
  });

  it('parses /shrug with and without text', () => {
    expect(parseSlashCommand('/shrug', 'Alice')).toEqual({
      type: 'text',
      content: '¯\\_(ツ)_/¯',
    });
    expect(parseSlashCommand('/shrug idk', 'Alice')).toEqual({
      type: 'text',
      content: 'idk ¯\\_(ツ)_/¯',
    });
  });

  it('parses /roll NdM and defaults to 1d6', () => {
    expect(parseSlashCommand('/roll', 'Alice', () => 0.5)).toEqual({
      type: 'system',
      content: '* Alice rolled 1d6: 4',
    });
    expect(parseSlashCommand('/roll 2d6', 'Alice', () => 0)).toEqual({
      type: 'system',
      content: '* Alice rolled 2d6: 2 [1, 1]',
    });
  });
});

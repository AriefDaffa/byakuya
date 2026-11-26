import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema, sanitizeRedirectPath } from '@/types/auth';

describe('loginSchema', () => {
  it('accepts a valid email and password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'supersecret',
    });

    expect(result.success).toBe(true);
  });

  it('rejects an invalid email address', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'supersecret',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Please enter a valid email');
    }
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'short',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Password must be at least 8 characters',
      );
    }
  });

  it('rejects missing credentials', () => {
    expect(loginSchema.safeParse({}).success).toBe(false);
    expect(loginSchema.safeParse(null).success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('accepts valid registration data', () => {
    const result = registerSchema.safeParse({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'supersecret',
    });

    expect(result.success).toBe(true);
  });

  it('rejects a name shorter than 2 characters', () => {
    const result = registerSchema.safeParse({
      name: 'J',
      email: 'jane@example.com',
      password: 'supersecret',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Name must be at least 2 characters');
    }
  });

  it('rejects an invalid email address', () => {
    const result = registerSchema.safeParse({
      name: 'Jane Doe',
      email: 'jane@',
      password: 'supersecret',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a short password', () => {
    const result = registerSchema.safeParse({
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: '1234567',
    });

    expect(result.success).toBe(false);
  });
});

describe('sanitizeRedirectPath', () => {
  it('falls back to "/" for empty values', () => {
    expect(sanitizeRedirectPath(undefined)).toBe('/');
    expect(sanitizeRedirectPath(null)).toBe('/');
    expect(sanitizeRedirectPath('')).toBe('/');
  });

  it('keeps safe relative paths with query strings', () => {
    expect(sanitizeRedirectPath('/')).toBe('/');
    expect(sanitizeRedirectPath('/chat')).toBe('/chat');
    expect(sanitizeRedirectPath('/chat/123?tab=members')).toBe('/chat/123?tab=members');
  });

  it('rejects absolute and protocol-relative URLs', () => {
    expect(sanitizeRedirectPath('https://evil.example')).toBe('/');
    expect(sanitizeRedirectPath('http://evil.example/login')).toBe('/');
    expect(sanitizeRedirectPath('//evil.example')).toBe('/');
    expect(sanitizeRedirectPath('///evil.example')).toBe('/');
    expect(sanitizeRedirectPath('/\\evil.example')).toBe('/');
  });

  it('rejects embedded credentials and schemes', () => {
    expect(sanitizeRedirectPath('/@evil.example')).toBe('/');
    expect(sanitizeRedirectPath('/user@evil.example')).toBe('/');
    expect(sanitizeRedirectPath('/javascript:alert(1)')).toBe('/');
    expect(sanitizeRedirectPath('/data:text/html,boom')).toBe('/');
  });

  it('rejects paths with whitespace or control characters', () => {
    expect(sanitizeRedirectPath('/ chat')).toBe('/');
    expect(sanitizeRedirectPath('/chat\n')).toBe('/');
  });

  it('rejects values that do not start with a slash', () => {
    expect(sanitizeRedirectPath('chat')).toBe('/');
    expect(sanitizeRedirectPath('?next=/chat')).toBe('/');
  });
});

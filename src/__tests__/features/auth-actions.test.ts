// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest';
import { SignJWT } from 'jose';
import {
  createSessionToken,
  hashPassword,
  verifyPassword,
  verifySessionToken,
} from '@/lib/auth/session';
import { loginSchema, registerSchema, sanitizeRedirectPath } from '@/types/auth';

const TEST_SECRET = 'test-auth-secret-that-is-long-enough-for-hs256';
const TEST_USER = {
  userId: '11111111-1111-4111-8111-111111111111',
  email: 'user@example.com',
};

beforeAll(() => {
  process.env.AUTH_SECRET = TEST_SECRET;
});

describe('loginSchema', () => {
  it('accepts a valid email and password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'supersecret',
    });

    expect(result.success).toBe(true);
  });

  it('normalizes email casing and surrounding whitespace', () => {
    const result = loginSchema.safeParse({
      email: '  User@Example.COM ',
      password: 'supersecret',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
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

  it('trims the name and normalizes the email', () => {
    const result = registerSchema.safeParse({
      name: '  Jane Doe  ',
      email: '  JANE@Example.com ',
      password: 'supersecret',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Jane Doe');
      expect(result.data.email).toBe('jane@example.com');
    }
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

describe('password hashing', () => {
  it('hashes with a random salt in salt:hash format', async () => {
    const first = await hashPassword('supersecret');
    const second = await hashPassword('supersecret');

    expect(first).toMatch(/^[0-9a-f]{32}:[0-9a-f]{128}$/);
    expect(second).not.toBe(first);
  });

  it('verifies the correct password', async () => {
    const hash = await hashPassword('supersecret');

    await expect(verifyPassword('supersecret', hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('supersecret');

    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });

  it('rejects malformed stored hashes', async () => {
    await expect(verifyPassword('supersecret', 'not-a-hash')).resolves.toBe(false);
    await expect(verifyPassword('supersecret', ':')).resolves.toBe(false);
    await expect(verifyPassword('supersecret', 'aabb:ccdd')).resolves.toBe(false);
  });
});

describe('session tokens', () => {
  it('round-trips a signed session token', async () => {
    const token = await createSessionToken(TEST_USER);

    expect(token.split('.')).toHaveLength(3);
    await expect(verifySessionToken(token)).resolves.toEqual(TEST_USER);
  });

  it('rejects a tampered token', async () => {
    const token = await createSessionToken(TEST_USER);
    const [header, payload, signature] = token.split('.');

    await expect(
      verifySessionToken(`${header}.${payload}.${signature}tampered`),
    ).resolves.toBeNull();
  });

  it('rejects tokens signed with a different secret', async () => {
    const token = await new SignJWT({ email: TEST_USER.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(TEST_USER.userId)
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(new TextEncoder().encode('a-different-secret'));

    await expect(verifySessionToken(token)).resolves.toBeNull();
  });

  it('rejects an expired token', async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = await new SignJWT({ email: TEST_USER.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(TEST_USER.userId)
      .setIssuedAt(now - 3600)
      .setExpirationTime(now - 60)
      .sign(new TextEncoder().encode(TEST_SECRET));

    await expect(verifySessionToken(token)).resolves.toBeNull();
  });

  it('rejects an empty token', async () => {
    await expect(verifySessionToken('')).resolves.toBeNull();
  });
});

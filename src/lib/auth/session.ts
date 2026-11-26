import { jwtVerify, SignJWT } from 'jose';
import type { Profile, UserStatus } from '@/types/database';

/**
 * Authentication primitives for the standalone PostgreSQL setup.
 *
 * This module deliberately keeps Node-only imports (`node:crypto`, `pg`,
 * `next/headers`) out of the top level: `src/proxy.ts` imports
 * `verifySessionToken` and must stay safe for the edge/edge-like runtimes.
 */

export const SESSION_COOKIE_NAME = 'byakuya_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

const SCRYPT_SALT_LENGTH = 16;
const SCRYPT_KEY_LENGTH = 64;
const TOKEN_ALGORITHM = 'HS256';

export type SessionPayload = {
  userId: string;
  email: string;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  status: UserStatus | null;
  last_seen: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error(
      'AUTH_SECRET is not set. Generate a 32+ character random secret and add it to your environment.',
    );
  }

  return new TextEncoder().encode(secret);
}

async function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  const { scrypt } = await import('node:crypto');

  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, SCRYPT_KEY_LENGTH, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derivedKey);
    });
  });
}

/**
 * Hashes a password with scrypt, returning `${saltHex}:${hashHex}`.
 */
export async function hashPassword(password: string): Promise<string> {
  const { randomBytes } = await import('node:crypto');
  const salt = randomBytes(SCRYPT_SALT_LENGTH);
  const derivedKey = await deriveKey(password, salt);

  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

/**
 * Verifies a password against a hash produced by `hashPassword`.
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(':');

  if (!saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');

  if (salt.length === 0 || expected.length === 0) return false;
  if (expected.length !== SCRYPT_KEY_LENGTH) return false;

  const derivedKey = await deriveKey(password, salt);
  const { timingSafeEqual } = await import('node:crypto');

  return timingSafeEqual(derivedKey, expected);
}

export async function createSessionToken({
  userId,
  email,
}: SessionPayload): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: TOKEN_ALGORITHM })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getAuthSecret());
}

/**
 * Returns the session payload, or `null` when the token is missing, malformed,
 * tampered with or expired. Never throws, so it is safe in the proxy.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret(), {
      algorithms: [TOKEN_ALGORITHM],
    });

    if (!payload.sub || typeof payload.email !== 'string') {
      return null;
    }

    return { userId: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
}

export async function setSessionCookie(userId: string, email: string): Promise<void> {
  const token = await createSessionToken({ userId, email });
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    ...cookieOptions(),
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, '', {
    ...cookieOptions(),
    maxAge: 0,
  });
}

function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function toProfile(row: UserRow): Profile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar_url: row.avatar_url,
    status: row.status,
    last_seen: row.last_seen === null ? null : toIsoString(row.last_seen),
    created_at: toIsoString(row.created_at),
    updated_at: toIsoString(row.updated_at),
  };
}

/**
 * Resolves the signed-in user from the session cookie. Server-only: it reads
 * cookies via `next/headers` and queries PostgreSQL.
 */
export async function getCurrentUser(): Promise<Profile | null> {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const session = await verifySessionToken(token);

  if (!session) return null;

  const { query } = await import('@/lib/db/pool');
  const result = await query<UserRow>(
    `SELECT id, name, email, avatar_url, status, last_seen, created_at, updated_at
     FROM public.users
     WHERE id = $1`,
    [session.userId],
  );

  const row = result.rows[0];

  return row ? toProfile(row) : null;
}

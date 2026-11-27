'use server';

import { redirect } from 'next/navigation';
import {
  clearSessionCookie,
  getCurrentUser,
  hashPassword,
  setSessionCookie,
  verifyPassword,
} from '@/lib/auth/session';
import { query } from '@/lib/db/pool';
import {
  loginSchema,
  registerSchema,
  sanitizeRedirectPath,
  type LoginFormData,
  type RegisterFormData,
  type SignUpResponse,
} from '@/types/auth';
import type { Profile, UserStatus } from '@/types/database';

const INVALID_CREDENTIALS = 'Invalid email or password';
const EMAIL_TAKEN = 'An account with this email already exists';
const USER_STATUSES: UserStatus[] = ['online', 'offline', 'away'];

type CredentialsRow = {
  id: string;
  email: string;
  password_hash: string;
};

type NewUserRow = {
  id: string;
  email: string;
};

function firstValidationError(issues: { message: string }[]): string {
  return issues[0]?.message ?? 'Invalid input';
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === '23505'
  );
}

export async function signIn(
  data: LoginFormData,
  nextPath?: string,
): Promise<{ error: string }> {
  const parsed = loginSchema.safeParse(data);

  if (!parsed.success) {
    return { error: firstValidationError(parsed.error.issues) };
  }

  const email = normalizeEmail(parsed.data.email);

  try {
    const result = await query<CredentialsRow>(
      `SELECT id, email, password_hash
       FROM public.users
       WHERE email = $1`,
      [email],
    );
    const user = result.rows[0];

    if (!user) {
      return { error: INVALID_CREDENTIALS };
    }

    const passwordMatches = await verifyPassword(
      parsed.data.password,
      user.password_hash,
    );

    if (!passwordMatches) {
      return { error: INVALID_CREDENTIALS };
    }

    await query(
      `UPDATE public.users
       SET status = 'online', last_seen = NOW()
       WHERE id = $1`,
      [user.id],
    );

    await setSessionCookie(user.id, user.email);
  } catch (error) {
    console.error('Failed to sign in', error);
    return { error: 'Unable to sign in right now. Please try again.' };
  }

  redirect(sanitizeRedirectPath(nextPath));
}

export async function signUp(data: RegisterFormData): Promise<SignUpResponse> {
  const parsed = registerSchema.safeParse(data);

  if (!parsed.success) {
    return { error: firstValidationError(parsed.error.issues) };
  }

  const email = normalizeEmail(parsed.data.email);

  try {
    const existing = await query('SELECT 1 FROM public.users WHERE email = $1 LIMIT 1', [
      email,
    ]);

    if ((existing.rowCount ?? 0) > 0) {
      return { error: EMAIL_TAKEN };
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const inserted = await query<NewUserRow>(
      `INSERT INTO public.users (name, email, password_hash, status, last_seen)
       VALUES ($1, $2, $3, 'online', NOW())
       RETURNING id, email`,
      [parsed.data.name, email, passwordHash],
    );
    const user = inserted.rows[0];

    if (!user) {
      return { error: 'Could not create your account. Please try again.' };
    }

    await setSessionCookie(user.id, user.email);

    return {
      success: true,
      autoSignedIn: true,
      message: 'Account created and you are now logged in!',
    };
  } catch (error) {
    // A concurrent sign-up can slip past the existence check; the unique
    // constraint is the source of truth.
    if (isUniqueViolation(error)) {
      return { error: EMAIL_TAKEN };
    }

    console.error('Failed to sign up', error);
    return { error: 'Unable to create your account right now. Please try again.' };
  }
}

export async function signOut(): Promise<void> {
  try {
    const user = await getCurrentUser();

    if (user) {
      await query(
        `UPDATE public.users
         SET status = 'offline', last_seen = NOW()
         WHERE id = $1`,
        [user.id],
      );
    }
  } catch (error) {
    console.error('Failed to mark user offline during sign out', error);
  }

  await clearSessionCookie();
  redirect('/login');
}

export async function updateStatus(
  status: UserStatus,
): Promise<{ success: boolean; error?: string }> {
  if (!USER_STATUSES.includes(status)) {
    return { success: false, error: 'Invalid status' };
  }

  const user = await getCurrentUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  await query(
    `UPDATE public.users
     SET status = $2, last_seen = NOW()
     WHERE id = $1`,
    [user.id, status],
  );

  return { success: true };
}

/**
 * Server Action equivalent of the removed `supabase.auth.getUser()`, for client
 * components that need the signed-in profile.
 */
export async function getMe(): Promise<Profile | null> {
  return getCurrentUser();
}

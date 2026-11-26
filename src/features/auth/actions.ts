'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  loginSchema,
  registerSchema,
  sanitizeRedirectPath,
  type LoginFormData,
  type RegisterFormData,
  type SignUpResponse,
} from '@/types/auth';

function firstValidationError(issues: { message: string }[]): string {
  return issues[0]?.message ?? 'Invalid input';
}

async function getAppOrigin(): Promise<string> {
  const fallback =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, '') || 'http://localhost:3000';

  try {
    const headersList = await headers();
    const origin = headersList.get('origin');

    if (origin) return origin;
  } catch {
    // headers() is unavailable outside of a request scope (e.g. tests).
  }

  return fallback;
}

export async function signIn(
  data: LoginFormData,
  next?: string,
): Promise<{ error: string }> {
  const parsed = loginSchema.safeParse(data);

  if (!parsed.success) {
    return { error: firstValidationError(parsed.error.issues) };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  // Best-effort presence update so a failed write never blocks the login.
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from('profiles')
        .update({ status: 'online', last_seen: new Date().toISOString() })
        .eq('id', user.id);
    }
  } catch (profileError) {
    console.error('Failed to mark profile online after sign in', profileError);
  }

  redirect(sanitizeRedirectPath(next));
}

export async function signUp(data: RegisterFormData): Promise<SignUpResponse> {
  const parsed = registerSchema.safeParse(data);

  if (!parsed.success) {
    return { error: firstValidationError(parsed.error.issues) };
  }

  const origin = await getAppOrigin();
  const supabase = await createClient();
  const requireEmailConfirmation =
    process.env.NEXT_PUBLIC_REQUIRE_EMAIL_CONFIRMATION === 'true';

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        name: parsed.data.name,
        avatar_url: null,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!requireEmailConfirmation) {
    // Auto-sign in the user if email confirmation is disabled
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (signInError) {
      // Sign up succeeded but auto-login failed, user can still log in manually
      return {
        success: true,
        message: 'Account created! You can now log in.',
      };
    }

    return {
      success: true,
      autoSignedIn: true,
      message: 'Account created and you are now logged in!',
    };
  }

  return {
    success: true,
    message: 'Account created! Please check your email to confirm your account.',
  };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();

  try {
    // Update profile status to offline before signing out (best-effort).
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from('profiles')
        .update({ status: 'offline', last_seen: new Date().toISOString() })
        .eq('id', user.id);
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Failed to sign out of Supabase', error);
    }
  } catch (signOutError) {
    console.error('Unexpected error while signing out', signOutError);
  }

  // Always send the user back to the login page, even if cleanup failed.
  redirect('/login');
}

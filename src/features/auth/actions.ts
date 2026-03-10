'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { LoginFormData, RegisterFormData, SignUpResponse } from '@/types/auth';

export async function signIn(data: LoginFormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return { error: error.message };
  }

  // Update profile status to online
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase
      .from('profiles')
      .update({ status: 'online', last_seen: new Date().toISOString() })
      .eq('id', user.id);
  }

  redirect('/');
}

export async function signUp(data: RegisterFormData): Promise<SignUpResponse> {
  const supabase = await createClient();
  const requireEmailConfirmation =
    process.env.NEXT_PUBLIC_REQUIRE_EMAIL_CONFIRMATION === 'true';

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name,
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
      email: data.email,
      password: data.password,
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

export async function signOut() {
  const supabase = await createClient();

  // Update profile status to offline before signing out
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase
      .from('profiles')
      .update({ status: 'offline', last_seen: new Date().toISOString() })
      .eq('id', user.id);
  }

  await supabase.auth.signOut();
  redirect('/login');
}

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  return data;
}

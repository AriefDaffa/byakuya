'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, sanitizeRedirectPath, type LoginFormData } from '@/types/auth';
import { signIn } from '@/features/auth/actions';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

/**
 * `redirect()` inside a server action rejects the client promise with a
 * `NEXT_REDIRECT` error. That is the success path, so it must be rethrown
 * instead of being reported as an unexpected failure.
 */
function isRedirectError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('digest' in error)) {
    return false;
  }

  const digest = (error as { digest?: unknown }).digest;

  return typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT');
}

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  // `next` only affects the redirect target, so reading it during the client
  // render cannot cause a hydration mismatch.
  const [nextPath] = useState(() =>
    typeof window === 'undefined'
      ? '/'
      : sanitizeRedirectPath(new URLSearchParams(window.location.search).get('next')),
  );

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const result = await signIn(data, nextPath);
      if (result?.error) {
        toast.error(result.error);
      }
    } catch (error) {
      // Successful logins reject with NEXT_REDIRECT; let Next.js navigate.
      if (isRedirectError(error)) throw error;
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="font-pixel text-2xl font-bold tracking-tight">
          Welcome Back to Byakuya
        </h1>
        <p className="text-muted-foreground text-sm">
          Enter your email and password to continue.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="font-pixel-mono text-sm font-semibold">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="pixel-input placeholder:text-muted-foreground w-full rounded-none px-3 py-2.5 text-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
            {...form.register('email')}
          />
          {form.formState.errors.email && (
            <p className="text-destructive text-sm">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="font-pixel-mono text-sm font-semibold">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="pixel-input placeholder:text-muted-foreground w-full rounded-none px-3 py-2.5 text-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
            {...form.register('password')}
          />
          {form.formState.errors.password && (
            <p className="text-destructive text-sm">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="pixel-btn bg-primary text-primary-foreground font-pixel mt-2 w-full rounded-none py-2.5 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="text-center text-sm">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="text-primary font-semibold underline decoration-2 underline-offset-4"
        >
          Register
        </Link>
      </p>
    </div>
  );
}

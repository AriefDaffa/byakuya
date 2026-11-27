'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, sanitizeRedirectPath, type LoginFormData } from '@/types/auth';
import { signIn } from '@/features/auth/actions';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

const inputClassName =
  'w-full rounded-none border-2 border-[#0b0e14] bg-[#f4f7fb] px-3 py-2.5 font-sans text-sm text-[#0f172a] shadow-[inset_2px_2px_0_rgba(0,0,0,0.16)] outline-none placeholder:text-[#64748b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b5e8a]';

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
        <h1 className="font-sans text-2xl font-bold tracking-tight text-[#0f172a]">
          Welcome Back to Byakuya
        </h1>
        <p className="font-sans text-sm text-[#334155]">
          Enter your email and password to continue.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="font-sans text-sm font-semibold text-[#0f172a]"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={inputClassName}
            {...form.register('email')}
          />
          {form.formState.errors.email && (
            <p className="font-sans text-sm text-[#b3261e]">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="font-sans text-sm font-semibold text-[#0f172a]"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className={inputClassName}
            {...form.register('password')}
          />
          {form.formState.errors.password && (
            <p className="font-sans text-sm text-[#b3261e]">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="pixel-btn mt-2 w-full rounded-none bg-[#1b5e8a] py-2.5 font-sans text-base font-semibold text-white hover:bg-[#2171a6] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <p className="text-center font-sans text-sm text-[#334155]">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-semibold text-[#1b5e8a] underline decoration-2 underline-offset-4 hover:text-[#2171a6]"
        >
          Register
        </Link>
      </p>
    </div>
  );
}

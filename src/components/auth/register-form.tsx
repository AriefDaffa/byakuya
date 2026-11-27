'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormData } from '@/types/auth';
import { signUp } from '@/features/auth/actions';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const inputClassName =
  'w-full rounded-none border-2 border-[#0b0e14] bg-[#f4f7fb] px-3 py-2.5 font-sans text-sm text-[#0f172a] shadow-[inset_2px_2px_0_rgba(0,0,0,0.16)] outline-none placeholder:text-[#64748b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b5e8a]';

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const result = await signUp(data);

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success(result?.message || 'Account created and you are now logged in!');
      // Refresh server components so the new session is picked up before
      // navigating to the app shell.
      router.refresh();
      router.push('/');
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="font-sans text-2xl font-bold tracking-tight text-[#0f172a]">
          Register to Byakuya
        </h1>
        <p className="font-sans text-sm text-[#334155]">
          Create your account to get started.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="name"
            className="font-sans text-sm font-semibold text-[#0f172a]"
          >
            Name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            className={inputClassName}
            {...form.register('name')}
          />
          {form.formState.errors.name && (
            <p className="font-sans text-sm text-[#b3261e]">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

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
            autoComplete="new-password"
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
          {isLoading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <p className="text-center font-sans text-sm text-[#334155]">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold text-[#1b5e8a] underline decoration-2 underline-offset-4 hover:text-[#2171a6]"
        >
          Login
        </Link>
      </p>
    </div>
  );
}

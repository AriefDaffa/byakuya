'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterFormData } from '@/types/auth';
import { signUp } from '@/features/auth/actions';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

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
        <h1 className="font-pixel text-2xl font-bold tracking-tight">
          Register to Byakuya
        </h1>
        <p className="text-muted-foreground text-sm">
          Create your account to get started.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="font-pixel-mono text-sm font-semibold">
            Name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            className="pixel-input placeholder:text-muted-foreground w-full rounded-none px-3 py-2.5 text-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]"
            {...form.register('name')}
          />
          {form.formState.errors.name && (
            <p className="text-destructive text-sm">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

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
            autoComplete="new-password"
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
          {isLoading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <p className="text-center text-sm">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-primary font-semibold underline decoration-2 underline-offset-4"
        >
          Login
        </Link>
      </p>
    </div>
  );
}

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
      } else if (result?.autoSignedIn) {
        toast.success('Account created and you are now logged in!');
        router.push('/');
      } else {
        toast.success(result?.message || 'Account created successfully!');
        form.reset();
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[450px] space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Register to Byakuya</h1>
        <p className="text-muted-foreground">Create your account to get started.</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            type="text"
            className="placeholder:text-muted-foreground focus:ring-ring w-full rounded-md border bg-transparent px-3 py-2 text-sm ring-0 outline-none focus:ring-2"
            {...form.register('name')}
          />
          {form.formState.errors.name && (
            <p className="text-destructive text-sm">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="placeholder:text-muted-foreground focus:ring-ring w-full rounded-md border bg-transparent px-3 py-2 text-sm ring-0 outline-none focus:ring-2"
            {...form.register('email')}
          />
          {form.formState.errors.email && (
            <p className="text-destructive text-sm">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="placeholder:text-muted-foreground focus:ring-ring w-full rounded-md border bg-transparent px-3 py-2 text-sm ring-0 outline-none focus:ring-2"
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
          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 w-full rounded-md px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <p className="text-center text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-primary font-medium">
          Login
        </Link>
      </p>
    </div>
  );
}

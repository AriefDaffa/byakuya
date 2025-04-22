'use client';

import type { FC } from 'react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/atoms/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Link from 'next/link';

import { ZLoginTypes } from '@/types/LoginTypes';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../atoms/input';
import { Button } from '../atoms/button';

interface LoginFormProps {
  isLoading: boolean;
  onSubmitHandler: (values: z.infer<typeof ZLoginTypes>) => Promise<void>;
}

const LoginForm: FC<LoginFormProps> = ({ onSubmitHandler, isLoading }) => {
  const form = useForm<z.infer<typeof ZLoginTypes>>({
    resolver: zodResolver(ZLoginTypes),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  return (
    <div className="space-y-6 w-full max-w-[450px]">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Welcome Back to Byakuya</h1>
        <p className="text-muted-foreground">
          Enter your email and password to continue.
        </p>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmitHandler)}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="mb-1">Email</FormLabel>
                <FormControl>
                  <Input placeholder="" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="mb-1">Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            disabled={isLoading}
            type="submit"
            className="w-full mt-4"
            size="lg"
          >
            Sign In
          </Button>
        </form>
      </Form>
      <div className="text-center text-sm">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-primary font-medium">
          Register
        </Link>
      </div>
    </div>
  );
};

export default LoginForm;

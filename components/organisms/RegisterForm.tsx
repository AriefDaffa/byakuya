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

import { zodResolver } from '@hookform/resolvers/zod';
import { ZRegisterTypes } from '@/types/Registertypes';
import { Input } from '../atoms/input';
import { Button } from '../atoms/button';

interface RegisterFormProps {
  isLoading: boolean;
  onSubmitHandler: (values: z.infer<typeof ZRegisterTypes>) => Promise<void>;
}

const RegisterForm: FC<RegisterFormProps> = ({
  onSubmitHandler,
  isLoading,
}) => {
  const form = useForm<z.infer<typeof ZRegisterTypes>>({
    resolver: zodResolver(ZRegisterTypes),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  return (
    <div className="space-y-6 w-full max-w-[450px]">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Register to Byakuya</h1>
        <p className="text-muted-foreground">
          Please fill this form to create the account
        </p>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmitHandler)}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="mb-1">Name</FormLabel>
                <FormControl>
                  <Input placeholder="" type="text" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
            Sign Up
          </Button>
        </form>
      </Form>
      <div className="text-center text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-primary font-medium">
          Login
        </Link>
      </div>
    </div>
  );
};

export default RegisterForm;

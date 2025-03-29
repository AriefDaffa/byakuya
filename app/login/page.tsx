'use client';

import { useState, type FC } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import LoginForm from '@/components/organisms/LoginForm';
import LoginTemplates from '@/components/templates/LoginTemplates';
import { authClient } from '@/lib/auth-client';
import { ZLoginTypes } from '@/types/LoginTypes';
import { useRouter } from 'next/navigation';

const LoginPage: FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (values: z.infer<typeof ZLoginTypes>) => {
    const { data } = await authClient.signIn.email(
      {
        email: values.email,
        password: values.password,
      },
      {
        onRequest: () => {
          setIsLoading(true);
        },
        onSuccess: () => {
          setIsLoading(false);
          toast.success('Login success');
          router.push('/');
        },
        onError: (ctx) => {
          console.log(ctx);
          setIsLoading(false);
          toast.error(ctx.error.message);
        },
      }
    );

    console.log(data);
  };

  return (
    <LoginTemplates
      loginForm={<LoginForm onSubmitHandler={onSubmit} isLoading={isLoading} />}
    />
  );
};

export default LoginPage;

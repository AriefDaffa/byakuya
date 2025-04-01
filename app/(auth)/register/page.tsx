'use client';

import { useState, type FC } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import RegisterForm from '@/components/organisms/RegisterForm';
import LoginTemplates from '@/components/templates/LoginTemplates';
import { authClient } from '@/lib/auth-client';
import { ZRegisterTypes } from '@/types/Registertypes';

const RegisterPage: FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (values: z.infer<typeof ZRegisterTypes>) => {
    const getRandomAnimeAvatar = async (): Promise<string> => {
      try {
        const response = await fetch('https://api.waifu.pics/sfw/waifu');
        const data = await response.json();
        return data.url;
      } catch (error) {
        console.error('Failed to fetch anime avatar:', error);
        return 'https://via.placeholder.com/150';
      }
    };

    const { data } = await authClient.signUp.email(
      {
        email: values.email,
        password: values.password,
        name: values.name,
        image: await getRandomAnimeAvatar(),
      },
      {
        onRequest: () => {
          setIsLoading(true);
        },
        onSuccess: () => {
          setIsLoading(false);
          toast.success('Account created');
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
      loginForm={
        <RegisterForm onSubmitHandler={onSubmit} isLoading={isLoading} />
      }
    />
  );
};

export default RegisterPage;

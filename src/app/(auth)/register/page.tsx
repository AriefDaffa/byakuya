import { RegisterForm } from '@/components/auth/register-form';
import { AuthLayout } from '@/components/layout/auth-layout';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register',
};

export default function RegisterPage() {
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  );
}

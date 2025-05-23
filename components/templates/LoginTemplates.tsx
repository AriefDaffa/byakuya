import Image from 'next/image';
import type { FC, ReactNode } from 'react';

interface LoginTemplatesProps {
  loginForm: ReactNode;
}

const LoginTemplates: FC<LoginTemplatesProps> = ({ loginForm }) => {
  return (
    <div className="flex h-screen items-center justify-center flex-col border-t md:flex-row">
      <div className="md:w-1/2">
        <div className="flex justify-center p-4">{loginForm}</div>
      </div>
      <div className="w-1/2 h-full p-6 hidden md:block">
        <div className="bg-gray-800 size-full rounded-xl relative overflow-hidden">
          <Image
            fill
            src={'/images/auth.gif'}
            alt=""
            className="object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default LoginTemplates;

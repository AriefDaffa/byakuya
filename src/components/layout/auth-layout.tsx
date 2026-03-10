import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex h-screen flex-col items-center justify-center border-t md:flex-row">
      <div className="md:w-1/2">
        <div className="flex justify-center p-4">{children}</div>
      </div>
      <div className="hidden h-full w-1/2 p-6 md:block">
        {/* <div className="relative size-full overflow-hidden rounded-xl bg-gray-800">
          <Image
            fill
            src="/images/auth.gif"
            alt="Authentication background"
            className="object-cover"
            priority
          />
        </div> */}
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <AlertTriangle className="text-destructive size-12" aria-hidden="true" />
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        An unexpected error occurred while loading this page. You can try again, or head
        back to your chats.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="hover:bg-accent rounded-md border px-4 py-2 text-sm font-medium transition-colors"
        >
          Back to chats
        </Link>
      </div>
    </div>
  );
}

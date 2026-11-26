import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <FileQuestion className="text-muted-foreground size-12" aria-hidden="true" />
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link
        href="/"
        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 text-sm font-medium transition-colors"
      >
        Back to chats
      </Link>
    </div>
  );
}

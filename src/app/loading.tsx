import { Loader } from '@/components/ui/loader';

export default function Loading() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3">
      <Loader size={32} />
      <p className="text-muted-foreground text-sm">Loading your chats...</p>
    </div>
  );
}

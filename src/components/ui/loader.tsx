import { cn } from '@/lib/utils';

interface LoaderProps {
  className?: string;
  size?: number;
}

const PIXEL_COLORS = ['bg-[var(--online)]', 'bg-[var(--unread)]', 'bg-primary'];

export function Loader({ className, size = 24 }: LoaderProps) {
  return (
    <div
      className={cn('flex size-full items-center justify-center p-6', className)}
      role="status"
    >
      <div
        className="pixel-panel bg-card flex items-center gap-1.5 rounded-none px-3 py-2"
        style={{ minHeight: size }}
      >
        {PIXEL_COLORS.map((color, index) => (
          <span
            key={color}
            className={cn(
              'size-2 animate-pulse border border-[var(--pixel-frame)]',
              color,
            )}
            style={{ animationDelay: `${index * 160}ms` }}
            aria-hidden="true"
          />
        ))}
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}

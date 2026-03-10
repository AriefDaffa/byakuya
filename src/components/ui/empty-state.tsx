import { CircleSlash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export function EmptyState({ title, subtitle, className }: EmptyStateProps) {
  return (
    <div className={cn('flex size-full items-center justify-center', className)}>
      <div className="space-y-2 px-4 text-center">
        <div className="mb-4 flex justify-center">
          <CircleSlash2 className="text-muted-foreground size-16" aria-hidden="true" />
        </div>
        {title && <p className="text-xl font-semibold">{title}</p>}
        {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
      </div>
    </div>
  );
}

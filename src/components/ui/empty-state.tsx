import { cn } from '@/lib/utils';
import { PixelCrestIcon } from '@/components/ui/pixel-icons';

interface EmptyStateProps {
  title?: string;
  subtitle?: string;
  className?: string;
}

export function EmptyState({ title, subtitle, className }: EmptyStateProps) {
  return (
    <div className={cn('flex size-full items-center justify-center p-6', className)}>
      <div className="pixel-panel bg-card flex w-full max-w-xs flex-col items-center gap-3 rounded-none px-6 py-7 text-center">
        <div className="pixel-box bg-muted flex size-12 items-center justify-center">
          <PixelCrestIcon className="text-muted-foreground size-7" />
        </div>
        {title && <p className="font-pixel text-base font-bold">{title}</p>}
        {subtitle && (
          <p className="text-muted-foreground font-pixel-mono text-xs leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

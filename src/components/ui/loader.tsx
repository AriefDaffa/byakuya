import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoaderProps {
  className?: string;
  size?: number;
}

export function Loader({ className, size = 24 }: LoaderProps) {
  return (
    <div className={cn('flex size-full items-center justify-center', className)}>
      <LoaderCircle className="animate-spin" size={size} />
    </div>
  );
}

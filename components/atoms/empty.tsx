import { CircleSlash2 } from 'lucide-react';
import type { FC } from 'react';

interface EmptyProps {
  title?: string;
  subTitle?: string;
}

const Empty: FC<EmptyProps> = ({ title, subTitle }) => {
  return (
    <div className="size-full flex items-center justify-center">
      <div className="space-y-2 text-center px-4">
        <div className="flex justify-center mb-4">
          <CircleSlash2 className="w-16 h-16 text-muted-foreground" />
        </div>
        <div className="text-xl font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">{subTitle}</div>
      </div>
    </div>
  );
};

export default Empty;

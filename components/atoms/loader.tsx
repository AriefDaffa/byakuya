import { LoaderCircle } from 'lucide-react';
import type { FC } from 'react';

const Loader: FC = () => {
  return (
    <div className="size-full flex items-center justify-center ">
      <LoaderCircle className="animate-spin" />
    </div>
  );
};

export default Loader;

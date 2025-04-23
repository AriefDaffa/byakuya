import type { FC, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface SliderBarProps {
  open: boolean;
  children: ReactNode;
  handleClose: () => void;
}

const SliderBar: FC<SliderBarProps> = ({ open, children, handleClose }) => {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: open ? 0 : '100%' }}
      transition={{ type: 'spring', bounce: 0 }}
      className="absolute top-0 right-0 bottom-0 w-full md:w-[40%] bg-background shadow-xl z-20 border border-l-0"
    >
      <div className="size-full relative">
        <div className="w-full h-20 flex items-center justify-between px-4 border-b">
          <div className="text-2xl font-bold">Detail</div>
          <X onClick={handleClose} />
        </div>
        <div className="">{children}</div>
      </div>
    </motion.div>
  );
};

export default SliderBar;

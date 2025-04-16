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
        <div
          className="absolute top-3 right-3 cursor-pointer"
          onClick={handleClose}
        >
          <X />
        </div>
        {children}
      </div>
    </motion.div>
  );
};

export default SliderBar;

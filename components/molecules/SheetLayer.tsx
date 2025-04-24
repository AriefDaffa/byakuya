import type { Dispatch, FC, ReactNode, SetStateAction } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../atoms/sheet';

interface SheetLayerProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  children: ReactNode;
}

const SheetLayer: FC<SheetLayerProps> = ({ children, open, setOpen }) => {
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="w-full">
        <SheetHeader>
          <SheetTitle></SheetTitle>
        </SheetHeader>
        <div className="">{children}</div>
      </SheetContent>
    </Sheet>
  );
};

export default SheetLayer;

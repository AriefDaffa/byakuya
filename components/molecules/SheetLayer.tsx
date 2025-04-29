import type { Dispatch, FC, ReactNode, SetStateAction } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../atoms/sheet';

interface SheetLayerProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  children: ReactNode;
  headerComp?: ReactNode;
}

const SheetLayer: FC<SheetLayerProps> = ({
  children,
  open,
  setOpen,
  headerComp = <></>,
}) => {
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="w-full">
        <SheetHeader className="p-0">
          <SheetTitle></SheetTitle>
          {headerComp}
        </SheetHeader>
        <div className="size-full">{children}</div>
      </SheetContent>
    </Sheet>
  );
};

export default SheetLayer;

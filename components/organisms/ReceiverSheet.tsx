import type { Dispatch, FC, SetStateAction } from 'react';
import ReceiverProfile from '../molecules/ReceiverProfile';
import SheetLayer from '../molecules/SheetLayer';

interface ReceiverSheetProps {
  open: boolean;
  avatar?: string;
  name?: string;
  email?: string;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const ReceiverSheet: FC<ReceiverSheetProps> = ({
  open,
  setOpen,
  avatar,
  email,
  name,
}) => {
  return (
    <SheetLayer open={open} setOpen={setOpen}>
      <ReceiverProfile avatar={avatar} email={email} name={name} />
    </SheetLayer>
  );
};

export default ReceiverSheet;

import type { Dispatch, FC, SetStateAction } from 'react';
import ReceiverProfile from '../molecules/ReceiverProfile';
import SheetLayer from '../molecules/SheetLayer';
import { authClient } from '@/lib/auth-client';

interface ReceiverSheetProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const ReceiverSheet: FC<ReceiverSheetProps> = ({ open, setOpen }) => {
  const { useSession } = authClient;
  const { data: session } = useSession();

  return (
    <SheetLayer open={open} setOpen={setOpen}>
      <ReceiverProfile
        avatar={session?.user.image || ''}
        email={session?.user.email}
        name={session?.user.name}
      />
    </SheetLayer>
  );
};

export default ReceiverSheet;

import { useMediaQuery } from '@mantine/hooks';
import { useEffect, useMemo, useState } from 'react';

export const useChatSlider = () => {
  const [openChatSlider, setOpenChatSlider] = useState(false);

  const matches = useMediaQuery('(min-width: 768px)');

  useEffect(() => {
    if (matches) {
      setOpenChatSlider(false);
    }
  }, [matches]);

  return useMemo(() => {
    return {
      openChatSlider,
      setOpenChatSlider,
    };
  }, [openChatSlider]);
};

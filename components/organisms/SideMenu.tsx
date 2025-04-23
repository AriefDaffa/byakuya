'use client';

import { Button } from '@/components/atoms/button';
import { LogOut, Moon, Sun, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState, type FC } from 'react';

interface SideMenuProps {
  avatar?: string;
  userName?: string;
}

const SideMenu: FC<SideMenuProps> = ({}) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="size-full items-center justify-between flex flex-col gap-2 py-4">
      <div className="flex flex-col items-center gap-2">
        <Button variant="ghost">
          <User />
        </Button>
        {mounted && (
          <Button
            variant="ghost"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>
        )}
        <Button variant="ghost" className="">
          <LogOut />
        </Button>
      </div>
    </div>
  );
};

export default SideMenu;

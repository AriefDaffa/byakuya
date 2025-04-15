'use client';

import { Button } from '@/components/atoms/button';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState, type FC } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../atoms/avatar';

interface SideMenuProps {
  avatar?: string;
  userName?: string;
}

const SideMenu: FC<SideMenuProps> = ({ avatar = '', userName = '' }) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="size-full items-center justify-between flex flex-col gap-2 py-4">
      <div className="flex flex-col items-center gap-2">
        <Avatar className={`h-9 w-9 rounded-md border`}>
          <AvatarImage src={avatar} alt={''} />
          <AvatarFallback>{userName.substring(0, 2)}</AvatarFallback>
        </Avatar>
        {mounted && (
          <Button
            variant="ghost"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>
        )}
      </div>
      <Button variant="destructive">
        <LogOut />
      </Button>
    </div>
  );
};

export default SideMenu;

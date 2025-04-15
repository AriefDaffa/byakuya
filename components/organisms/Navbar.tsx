'use client';

import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/atoms/avatar';
import { Badge } from '@/components/atoms/badge';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import type { FC } from 'react';

interface NavbarProps {
  userName?: string;
  avatar?: string;
}

const Navbar: FC<NavbarProps> = ({ avatar = '', userName }) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="h-16 w-full border flex items-center justify-between px-2">
      <div className="text-2xl font-bold text-primary">Byakuya</div>

      {mounted && (
        <Badge
          className="cursor-pointer"
          variant={'themer'}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun /> : <Moon />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </Badge>
      )}

      <Avatar className="h-10 w-10 rounded-lg">
        <AvatarImage src={avatar} alt="" />
        <AvatarFallback>{userName?.charAt(0)}</AvatarFallback>
      </Avatar>
    </div>
  );
};

export default Navbar;

'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState, type FC } from 'react';
import { Button } from '../atoms/button';

interface SidebarHeaderProps {
  userName?: string;
}

const SidebarHeader: FC<SidebarHeaderProps> = ({ userName }) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex gap-2 items-center justify-between">
      <div className="">
        <div className="text-xs text-muted-foreground">Welcome,</div>
        <div className="text-xl font-semibold">{userName}</div>
      </div>
      <div className="">
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
          </Button>
        )}
      </div>
    </div>
  );
};

export default SidebarHeader;

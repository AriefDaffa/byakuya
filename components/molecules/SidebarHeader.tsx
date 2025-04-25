'use client';

import { authClient } from '@/lib/auth-client';
import {
  EllipsisVertical,
  LogOut,
  Moon,
  Paintbrush,
  Sun,
  User,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FC } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../atoms/dropdown-menu';

interface SidebarHeaderProps {
  userName?: string;
}

const SidebarHeader: FC<SidebarHeaderProps> = ({ userName }) => {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
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
        <DropdownMenu>
          <DropdownMenuTrigger className="size-9 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive">
            <EllipsisVertical />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-36">
            <DropdownMenuLabel>Menu</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="">
              <User /> Profile
            </DropdownMenuItem>
            {mounted && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Paintbrush size={15} className="mr-2" /> Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={theme}
                      onValueChange={setTheme}
                    >
                      <DropdownMenuRadioItem value="dark">
                        <Moon />
                        Dark Mode
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="light">
                        <Sun /> Light Mode
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () =>
                await authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      router.push('/login');
                    },
                  },
                })
              }
            >
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default SidebarHeader;

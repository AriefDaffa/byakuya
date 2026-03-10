'use client';

import { signOut } from '@/features/auth/actions';
import { useChatStore } from '@/store/chat-store';
import { EllipsisVertical, LogOut, Moon, Paintbrush, Sun, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface SidebarHeaderProps {
  userName?: string;
}

export function SidebarHeader({ userName }: SidebarHeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toggleProfile, selectedUser } = useChatStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex items-center justify-between gap-2">
      <div>
        <p className="text-muted-foreground text-xs">Welcome,</p>
        <h2 className="text-xl font-semibold">{userName}</h2>
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="hover:bg-accent inline-flex size-9 items-center justify-center rounded-md transition-colors"
          aria-label="Open menu"
          aria-expanded={isMenuOpen}
        >
          <EllipsisVertical className="size-4" />
        </button>

        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
            {/* Menu */}
            <div className="bg-popover absolute right-0 z-50 mt-1 w-40 rounded-md border p-1 shadow-md">
              <p className="px-2 py-1.5 text-sm font-semibold">Menu</p>
              <div className="bg-border my-1 h-px" />
              <button
                type="button"
                onClick={() => {
                  if (selectedUser) {
                    toggleProfile();
                  }
                  setIsMenuOpen(false);
                }}
                className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
              >
                <User className="size-4" /> Profile
              </button>
              {mounted && (
                <button
                  type="button"
                  onClick={() => {
                    setTheme(theme === 'dark' ? 'light' : 'dark');
                    setIsMenuOpen(false);
                  }}
                  className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
                >
                  <Paintbrush className="size-4" />
                  {theme === 'dark' ? (
                    <>
                      <Sun className="size-3" /> Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="size-3" /> Dark Mode
                    </>
                  )}
                </button>
              )}
              <div className="bg-border my-1 h-px" />
              <button
                type="button"
                onClick={() => signOut()}
                className="text-destructive hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm"
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

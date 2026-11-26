'use client';

import { signOut } from '@/features/auth/actions';
import { useChatListStore } from '@/store/chat-list-store';
import { useChatStore } from '@/store/chat-store';
import { EllipsisVertical, LogOut, Moon, Paintbrush, Sun, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useSyncExternalStore } from 'react';

interface SidebarHeaderProps {
  userName?: string;
}

const emptySubscribe = () => () => {};

/**
 * Hydration-safe "is the client mounted" flag.
 * `useSyncExternalStore` returns `false` during SSR and `true` on the client
 * without calling `setState` from an effect.
 */
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function SidebarHeader({ userName }: SidebarHeaderProps) {
  const { theme, setTheme } = useTheme();
  const mounted = useIsMounted();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleProfile = useChatStore((state) => state.toggleProfile);
  const selectedUser = useChatStore((state) => state.selectedUser);

  const handleSignOut = () => {
    // Clear all user-scoped state before signing out so it can never leak
    // into the next session.
    useChatStore.getState().resetChat();
    useChatStore.setState({ isChatSliderOpen: false, isProfileOpen: false });

    const chatListStore = useChatListStore.getState();
    chatListStore.setChatList([]);
    chatListStore.setSearchKeyword('');

    setIsMenuOpen(false);
    void signOut();
  };

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
                onClick={handleSignOut}
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

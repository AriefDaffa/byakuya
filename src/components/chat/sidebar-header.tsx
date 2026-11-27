'use client';

import { signOut } from '@/features/auth/actions';
import { useChatListStore } from '@/store/chat-list-store';
import { useChatStore } from '@/store/chat-store';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PixelMenuIcon } from '@/components/ui/pixel-icons';
import { LogOut, Moon, Paintbrush, Sun, User } from 'lucide-react';
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

  const initial = userName?.trim().substring(0, 1).toUpperCase() || '?';

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="relative shrink-0">
          <Avatar className="size-10">
            <AvatarFallback className="font-pixel text-sm font-bold">
              {initial}
            </AvatarFallback>
          </Avatar>
          <span
            className="absolute -right-0.5 -bottom-0.5 size-2.5 border border-[var(--pixel-frame)] bg-[var(--online)]"
            aria-hidden="true"
          />
        </div>
        <h2 className="font-pixel min-w-0 truncate text-base font-bold">
          {userName || 'Byakuya'}
        </h2>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="pixel-btn bg-card text-foreground inline-flex size-9 items-center justify-center"
          aria-label="Open menu"
          aria-expanded={isMenuOpen}
        >
          <PixelMenuIcon className="size-4" />
        </button>

        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
            {/* Menu */}
            <div className="pixel-panel bg-popover absolute right-0 z-50 mt-2 w-44 rounded-none p-1">
              <p className="font-pixel text-muted-foreground px-2 py-1.5 text-xs font-bold uppercase">
                Menu
              </p>
              <div className="my-1 h-0.5 bg-[var(--pixel-frame)]" />
              <button
                type="button"
                onClick={() => {
                  if (selectedUser) {
                    toggleProfile();
                  }
                  setIsMenuOpen(false);
                }}
                className="hover:bg-accent font-pixel-mono flex w-full items-center gap-2 rounded-none px-2 py-1.5 text-xs"
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
                  className="hover:bg-accent font-pixel-mono flex w-full items-center gap-2 rounded-none px-2 py-1.5 text-xs"
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
              <div className="my-1 h-0.5 bg-[var(--pixel-frame)]" />
              <button
                type="button"
                onClick={handleSignOut}
                className="text-destructive hover:bg-accent font-pixel-mono flex w-full items-center gap-2 rounded-none px-2 py-1.5 text-xs"
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

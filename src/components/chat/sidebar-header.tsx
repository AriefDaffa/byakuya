'use client';

import { signOut } from '@/features/auth/actions';
import { useChatListStore } from '@/store/chat-list-store';
import { useChatStore } from '@/store/chat-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PixelAvatarEditor } from '@/components/chat/pixel-avatar-editor';
import { PixelMenuIcon } from '@/components/ui/pixel-icons';
import { isSoundMuted, setSoundMuted } from '@/lib/sound';
import {
  Grid3X3,
  LogOut,
  Moon,
  Paintbrush,
  Sun,
  User,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState, useSyncExternalStore } from 'react';

interface SidebarHeaderProps {
  userName?: string;
  userAvatarUrl?: string | null;
  onAvatarUpdated?: (avatarUrl: string) => void;
  onOpenCreateGroup?: () => void;
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

export function SidebarHeader({
  userName,
  userAvatarUrl,
  onAvatarUpdated,
  onOpenCreateGroup,
}: SidebarHeaderProps) {
  const { theme, setTheme } = useTheme();
  const mounted = useIsMounted();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAvatarEditorOpen, setIsAvatarEditorOpen] = useState(false);
  const [muted, setMuted] = useState(() => isSoundMuted());
  const toggleProfile = useChatStore((state) => state.toggleProfile);
  const selectedUser = useChatStore((state) => state.selectedUser);
  const selectedConversation = useChatStore((state) => state.selectedConversation);

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

  const displayName = userName?.trim() || 'Byakuya';

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative shrink-0">
          <Avatar className="size-12 border-2 border-[#090c12] shadow-[2px_2px_0_#07090e]">
            <AvatarImage src={userAvatarUrl || ''} alt={displayName} />
            <AvatarFallback>{displayName}</AvatarFallback>
          </Avatar>
          <span
            className="absolute -right-0.5 -bottom-0.5 size-3 border-2 border-[#090c12] bg-[var(--online)]"
            aria-hidden="true"
          />
        </div>
        <h2 className="min-w-0 truncate font-sans text-base leading-tight font-bold">
          {displayName}
        </h2>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="pixel-btn bg-card text-foreground inline-flex size-10 items-center justify-center"
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
              <p className="text-muted-foreground px-2 py-1.5 font-sans text-[11px] font-semibold tracking-wider uppercase">
                Menu
              </p>
              <div className="my-1 h-0.5 bg-[var(--pixel-frame)]" />
              <button
                type="button"
                onClick={() => {
                  if (selectedUser || selectedConversation) {
                    toggleProfile();
                  }
                  setIsMenuOpen(false);
                }}
                className="hover:bg-accent flex w-full items-center gap-2 rounded-none px-2 py-2 font-sans text-sm font-medium"
              >
                <User className="size-4" /> Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAvatarEditorOpen(true);
                  setIsMenuOpen(false);
                }}
                className="hover:bg-accent flex w-full items-center gap-2 rounded-none px-2 py-2 font-sans text-sm font-medium"
              >
                <Grid3X3 className="size-4" /> Pixel Avatar
              </button>
              {onOpenCreateGroup && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenCreateGroup();
                    setIsMenuOpen(false);
                  }}
                  className="hover:bg-accent flex w-full items-center gap-2 rounded-none px-2 py-2 font-sans text-sm font-medium"
                >
                  <Users className="size-4" /> New Group
                </button>
              )}
              {mounted && (
                <button
                  type="button"
                  onClick={() => {
                    const nextMuted = !muted;
                    setMuted(nextMuted);
                    setSoundMuted(nextMuted);
                    setIsMenuOpen(false);
                  }}
                  className="hover:bg-accent flex w-full items-center gap-2 rounded-none px-2 py-2 font-sans text-sm font-medium"
                >
                  {muted ? (
                    <>
                      <VolumeX className="size-4" /> 8-Bit SFX: Off
                    </>
                  ) : (
                    <>
                      <Volume2 className="size-4" /> 8-Bit SFX: On
                    </>
                  )}
                </button>
              )}
              {mounted && (
                <button
                  type="button"
                  onClick={() => {
                    setTheme(theme === 'dark' ? 'light' : 'dark');
                    setIsMenuOpen(false);
                  }}
                  className="hover:bg-accent flex w-full items-center gap-2 rounded-none px-2 py-2 font-sans text-sm font-medium"
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
                className="text-destructive hover:bg-accent flex w-full items-center gap-2 rounded-none px-2 py-2 font-sans text-sm font-medium"
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </div>
          </>
        )}
      </div>

      {isAvatarEditorOpen && (
        <PixelAvatarEditor
          initialAvatarUrl={userAvatarUrl}
          onClose={() => setIsAvatarEditorOpen(false)}
          onSaved={(newUrl) => onAvatarUpdated?.(newUrl)}
        />
      )}
    </div>
  );
}

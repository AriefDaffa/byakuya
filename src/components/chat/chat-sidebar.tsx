'use client';

import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useChatList } from '@/hooks/use-chat-list';
import { useChatSearch } from '@/hooks/use-chat-search';
import { useChatListStore } from '@/store/chat-list-store';
import { useChatStore } from '@/store/chat-store';
import { ChatListItemComponent } from '@/components/chat/chat-list-item';
import { SidebarHeader } from '@/components/chat/sidebar-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Loader } from '@/components/ui/loader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PixelSearchIcon } from '@/components/ui/pixel-icons';
import { getOrCreateConversation } from '@/features/chat/actions';
import { getMe } from '@/features/auth/actions';
import { useCallback, useEffect, useState } from 'react';
import type { Profile } from '@/types/database';

export function ChatSidebar() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  const { data, isLoading, refetch } = useChatList();
  const { onSearch, results, isLoading: isSearching } = useChatSearch();
  const searchKeyword = useChatListStore((state) => state.searchKeyword);
  const setSearchKeyword = useChatListStore((state) => state.setSearchKeyword);
  const setSelectedUser = useChatStore((state) => state.setSelectedUser);
  const selectedUser = useChatStore((state) => state.selectedUser);
  const setConversationId = useChatStore((state) => state.setConversationId);
  const toggleChatSlider = useChatStore((state) => state.toggleChatSlider);
  const setMessageInput = useChatStore((state) => state.setMessageInput);
  const setEditingMessage = useChatStore((state) => state.setEditingMessage);

  // Get current user profile
  useEffect(() => {
    let cancelled = false;

    void getMe()
      .then((profile) => {
        if (!cancelled) {
          setCurrentUser(profile);
        }
      })
      .catch((error: unknown) => {
        console.error('Failed to load current user:', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const openChat = useCallback(
    (conversationId: string, user: Profile) => {
      setSelectedUser(user);
      setConversationId(conversationId);
      // Never carry a draft or an active edit across conversations.
      setMessageInput('');
      setEditingMessage(null);
      setSearchKeyword('');
      onSearch('');

      if (window.innerWidth < 768) {
        toggleChatSlider();
      }
    },
    [
      onSearch,
      setConversationId,
      setEditingMessage,
      setMessageInput,
      setSearchKeyword,
      setSelectedUser,
      toggleChatSlider,
    ],
  );

  const handleSelectUser = useCallback(
    async (user: Profile) => {
      // Resolve the conversation *before* selecting it: opening a chat with a
      // null conversation ID would leave the UI in a broken state.
      const result = await getOrCreateConversation(user.id);

      if ('error' in result && result.error) {
        toast.error(result.error);
        return;
      }

      if (!('conversationId' in result) || !result.conversationId) {
        toast.error('Unable to open conversation');
        return;
      }

      openChat(result.conversationId, user);
      void refetch();
    },
    [openChat, refetch],
  );

  const handleSelectSearchMessage = useCallback(
    (conversationId: string) => {
      // Open the conversation the message belongs to. `msg.sender` is who wrote
      // the message, which is not necessarily the person we are chatting with.
      const item = data.find((entry) => entry.conversation.id === conversationId);

      if (!item?.otherUser) {
        toast.error('Unable to open that conversation');
        return;
      }

      openChat(conversationId, item.otherUser);
    },
    [data, openChat],
  );

  return (
    <div className="bg-sidebar relative flex size-full min-h-0 flex-col border-r-2 border-[var(--pixel-frame)]">
      <div className="space-y-3 border-b-2 border-[var(--pixel-frame)] px-3 py-3">
        <SidebarHeader userName={currentUser?.name} />
        <div className="relative w-full">
          <PixelSearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search..."
            className="pixel-input placeholder:text-muted-foreground w-full rounded-none py-2.5 pr-8 pl-9 font-sans text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            aria-label="Search conversations"
          />
          {searchKeyword && (
            <button
              type="button"
              onClick={() => {
                setSearchKeyword('');
                onSearch('');
              }}
              className="text-muted-foreground hover:text-foreground absolute top-0 right-1.5 bottom-0 my-auto inline-flex size-6 items-center justify-center"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      {searchKeyword ? (
        isSearching ? (
          <Loader />
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            {results.users.length > 0 && (
              <>
                <div className="text-muted-foreground border-b border-[var(--pixel-frame)] bg-[var(--card)] px-3 py-2 font-sans text-[11px] font-semibold tracking-wider uppercase">
                  Users
                </div>
                {results.users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    className="hover:bg-accent flex w-full items-center gap-3 border-b border-[var(--pixel-frame)] px-3 py-2.5 text-left transition-colors"
                  >
                    <Avatar className="size-10">
                      <AvatarImage src={user.avatar_url || ''} alt={user.name} />
                      <AvatarFallback>{user.name}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-sans text-sm font-semibold">
                        {user.name}
                      </p>
                      <p className="text-muted-foreground truncate font-sans text-xs">
                        {user.email}
                      </p>
                    </div>
                  </button>
                ))}
              </>
            )}
            {results.messages.length > 0 && (
              <>
                <div className="text-muted-foreground border-b border-[var(--pixel-frame)] bg-[var(--card)] px-3 py-2 font-sans text-[11px] font-semibold tracking-wider uppercase">
                  Messages
                </div>
                {results.messages.map((msg) => (
                  <button
                    key={msg.id}
                    type="button"
                    onClick={() => handleSelectSearchMessage(msg.conversation_id)}
                    className="hover:bg-accent flex w-full items-center gap-3 border-b border-[var(--pixel-frame)] px-3 py-2.5 text-left transition-colors"
                  >
                    <Avatar className="size-10">
                      <AvatarImage
                        src={msg.sender.avatar_url || ''}
                        alt={msg.sender.name}
                      />
                      <AvatarFallback>{msg.sender.name}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-sans text-sm font-semibold">
                        {msg.sender.id === currentUser?.id ? 'You' : msg.sender.name}
                      </p>
                      <p className="text-muted-foreground truncate font-sans text-xs">
                        {msg.content}
                      </p>
                    </div>
                  </button>
                ))}
              </>
            )}
            {results.users.length === 0 && results.messages.length === 0 && (
              <EmptyState title="No results" subtitle="Try a different search term" />
            )}
          </div>
        )
      ) : (
        /* Chat List */
        <>
          {isLoading ? (
            <Loader />
          ) : data.length === 0 ? (
            <EmptyState
              title="No conversations"
              subtitle="Start a conversation by searching for users above"
            />
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto">
              {data.map((item) => (
                <ChatListItemComponent
                  key={item.conversation.id}
                  item={item}
                  isActive={Boolean(
                    selectedUser?.id && item.otherUser?.id === selectedUser.id,
                  )}
                  onClick={() =>
                    item.otherUser && openChat(item.conversation.id, item.otherUser)
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

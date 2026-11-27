'use client';

import { X } from 'lucide-react';
import { toast } from 'sonner';
import { useChatList } from '@/hooks/use-chat-list';
import { useChatSearch } from '@/hooks/use-chat-search';
import { useChatListStore } from '@/store/chat-list-store';
import { useChatStore } from '@/store/chat-store';
import { ChatListItemComponent } from '@/components/chat/chat-list-item';
import { CreateGroupDialog } from '@/components/chat/create-group-dialog';
import { SidebarHeader } from '@/components/chat/sidebar-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Loader } from '@/components/ui/loader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PixelSearchIcon } from '@/components/ui/pixel-icons';
import { getOrCreateConversation } from '@/features/chat/actions';
import { getMe } from '@/features/auth/actions';
import { useCallback, useEffect, useState } from 'react';
import type { ChatListItem } from '@/types/chat';
import type { Profile } from '@/types/database';

export function ChatSidebar() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  const { data, isLoading, refetch } = useChatList();
  const { onSearch, results, isLoading: isSearching } = useChatSearch();
  const searchKeyword = useChatListStore((state) => state.searchKeyword);
  const setSearchKeyword = useChatListStore((state) => state.setSearchKeyword);
  const setSelectedUser = useChatStore((state) => state.setSelectedUser);
  const setSelectedConversation = useChatStore((state) => state.setSelectedConversation);
  const conversationId = useChatStore((state) => state.conversationId);
  const setConversationId = useChatStore((state) => state.setConversationId);
  const toggleChatSlider = useChatStore((state) => state.toggleChatSlider);
  const setMessageInput = useChatStore((state) => state.setMessageInput);
  const setEditingMessage = useChatStore((state) => state.setEditingMessage);
  const setReplyingTo = useChatStore((state) => state.setReplyingTo);

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
    (nextConversationId: string, user: Profile | null, item: ChatListItem | null = null) => {
      setSelectedUser(user);
      setSelectedConversation(item);
      setConversationId(nextConversationId);
      // Never carry a draft, reply, or active edit across conversations.
      setMessageInput('');
      setEditingMessage(null);
      setReplyingTo(null);
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
      setReplyingTo,
      setSearchKeyword,
      setSelectedConversation,
      setSelectedUser,
      toggleChatSlider,
    ],
  );

  const handleSelectUser = useCallback(
    async (user: Profile) => {
      const result = await getOrCreateConversation(user.id);

      if ('error' in result && result.error) {
        toast.error(result.error);
        return;
      }

      if (!('conversationId' in result) || !result.conversationId) {
        toast.error('Unable to open conversation');
        return;
      }

      openChat(result.conversationId, user, null);
      void refetch();
    },
    [openChat, refetch],
  );

  const handleSelectSearchMessage = useCallback(
    (targetConversationId: string) => {
      const item = data.find((entry) => entry.conversation.id === targetConversationId);

      if (!item) {
        toast.error('Unable to open that conversation');
        return;
      }

      openChat(targetConversationId, item.otherUser, item);
    },
    [data, openChat],
  );

  return (
    <div className="bg-sidebar relative flex size-full min-h-0 flex-col border-r-2 border-[var(--pixel-frame)]">
      <div className="space-y-3 border-b-2 border-[#090c12] px-4 py-3.5">
        <SidebarHeader
          userName={currentUser?.name}
          userAvatarUrl={currentUser?.avatar_url}
          onAvatarUpdated={(newUrl) =>
            setCurrentUser((prev) => (prev ? { ...prev, avatar_url: newUrl } : prev))
          }
          onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
        />
        <div className="relative w-full">
          <PixelSearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-[18px] -translate-y-1/2" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search..."
            className="pixel-input placeholder:text-muted-foreground h-11 w-full rounded-none pr-9 pl-10 font-sans text-base outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            aria-label="Search conversations"
          />
          {searchKeyword && (
            <button
              type="button"
              onClick={() => {
                setSearchKeyword('');
                onSearch('');
              }}
              className="text-muted-foreground hover:text-foreground absolute top-0 right-2 bottom-0 my-auto inline-flex size-6 items-center justify-center"
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
                <div className="text-muted-foreground border-b-2 border-[#0b0e14]/70 bg-[var(--card)] px-4 py-2.5 font-sans text-[11px] font-semibold tracking-wider uppercase">
                  Users
                </div>
                {results.users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    className="hover:bg-accent flex w-full items-center gap-3 border-b-2 border-[#0b0e14]/70 px-4 py-2.5 text-left transition-colors"
                  >
                    <Avatar className="size-12 border-2 border-[#090c12] shadow-[2px_2px_0_#07090e]">
                      <AvatarImage src={user.avatar_url || ''} alt={user.name} />
                      <AvatarFallback>{user.name}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-sans text-base leading-tight font-semibold">
                        {user.name}
                      </p>
                      <p className="text-muted-foreground mt-0.5 truncate font-sans text-sm">
                        {user.email}
                      </p>
                    </div>
                  </button>
                ))}
              </>
            )}
            {results.messages.length > 0 && (
              <>
                <div className="text-muted-foreground border-b-2 border-[#0b0e14]/70 bg-[var(--card)] px-4 py-2.5 font-sans text-[11px] font-semibold tracking-wider uppercase">
                  Messages
                </div>
                {results.messages.map((msg) => (
                  <button
                    key={msg.id}
                    type="button"
                    onClick={() => handleSelectSearchMessage(msg.conversation_id)}
                    className="hover:bg-accent flex w-full items-center gap-3 border-b-2 border-[#0b0e14]/70 px-4 py-2.5 text-left transition-colors"
                  >
                    <Avatar className="size-12 border-2 border-[#090c12] shadow-[2px_2px_0_#07090e]">
                      <AvatarImage
                        src={msg.sender.avatar_url || ''}
                        alt={msg.sender.name}
                      />
                      <AvatarFallback>{msg.sender.name}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-sans text-base leading-tight font-semibold">
                        {msg.sender.id === currentUser?.id ? 'You' : msg.sender.name}
                      </p>
                      <p className="text-muted-foreground mt-0.5 truncate font-sans text-sm">
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
                  isActive={conversationId === item.conversation.id}
                  onClick={() => openChat(item.conversation.id, item.otherUser, item)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {isCreateGroupOpen && (
        <CreateGroupDialog
          onClose={() => setIsCreateGroupOpen(false)}
          onCreated={(newConversationId) => {
            setConversationId(newConversationId);
            void refetch();
          }}
        />
      )}
    </div>
  );
}

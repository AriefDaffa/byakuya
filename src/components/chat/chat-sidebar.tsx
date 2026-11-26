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
import { getOrCreateConversation } from '@/features/chat/actions';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';

export function ChatSidebar() {
  const supabase = useMemo(() => createClient(), []);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  const { data, isLoading } = useChatList();
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
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setCurrentUser(profile);
      }
    });
  }, [supabase]);

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
    },
    [openChat],
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
    <div className="relative flex size-full flex-col border-r border-b border-l">
      <div className="space-y-4 border-b px-3 pt-6 pb-4">
        <SidebarHeader userName={currentUser?.name} />
        <div className="relative w-full">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search users or messages..."
            className="placeholder:text-muted-foreground focus:ring-ring w-full rounded-md border bg-transparent px-3 py-2 text-sm ring-0 outline-none focus:ring-2"
            aria-label="Search conversations"
          />
          {searchKeyword && (
            <button
              type="button"
              onClick={() => {
                setSearchKeyword('');
                onSearch('');
              }}
              className="text-muted-foreground absolute top-0 right-2 bottom-0 my-auto"
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      {searchKeyword ? (
        isSearching ? (
          <Loader />
        ) : (
          <div className="flex-1 overflow-y-auto">
            {results.users.length > 0 && (
              <>
                <div className="text-muted-foreground border-b p-4 text-xs font-semibold uppercase">
                  Users
                </div>
                {results.users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    className="hover:bg-accent flex w-full items-center gap-3 border-b px-3 py-3 text-left transition-colors"
                  >
                    <Avatar className="size-10">
                      <AvatarImage src={user.avatar_url || ''} alt={user.name} />
                      <AvatarFallback>
                        {user.name.substring(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-muted-foreground text-xs">{user.email}</p>
                    </div>
                  </button>
                ))}
              </>
            )}
            {results.messages.length > 0 && (
              <>
                <div className="text-muted-foreground border-b p-4 text-xs font-semibold uppercase">
                  Messages
                </div>
                {results.messages.map((msg) => (
                  <button
                    key={msg.id}
                    type="button"
                    onClick={() => handleSelectSearchMessage(msg.conversation_id)}
                    className="hover:bg-accent flex w-full items-center gap-3 border-b px-3 py-3 text-left transition-colors"
                  >
                    <Avatar className="size-10">
                      <AvatarImage
                        src={msg.sender.avatar_url || ''}
                        alt={msg.sender.name}
                      />
                      <AvatarFallback>
                        {msg.sender.name.substring(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {msg.sender.id === currentUser?.id ? 'You' : msg.sender.name}
                      </p>
                      <p className="text-muted-foreground truncate text-sm">
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
            <div className="flex-1 overflow-y-auto">
              {data.map((item) => (
                <ChatListItemComponent
                  key={item.conversation.id}
                  item={item}
                  isActive={selectedUser?.id === item.otherUser?.id}
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

'use client';

import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatSection } from '@/components/chat/chat-section';
import { ChatLayout } from '@/components/layout/chat-layout';
import { SheetOverlay } from '@/components/layout/sheet-overlay';
import { ReceiverProfile } from '@/components/chat/receiver-profile';
import { useChatStore } from '@/store/chat-store';
import { usePresence } from '@/hooks/use-realtime';
import { getMe } from '@/features/auth/actions';
import { useEffect, useState } from 'react';

export function ChatPageClient() {
  const [userId, setUserId] = useState<string | null>(null);

  const selectedUser = useChatStore((state) => state.selectedUser);
  const selectedConversation = useChatStore((state) => state.selectedConversation);
  const isChatSliderOpen = useChatStore((state) => state.isChatSliderOpen);
  const toggleChatSlider = useChatStore((state) => state.toggleChatSlider);
  const isProfileOpen = useChatStore((state) => state.isProfileOpen);
  const toggleProfile = useChatStore((state) => state.toggleProfile);

  // Get user ID for presence
  useEffect(() => {
    let active = true;
    getMe().then((user) => {
      if (active) {
        setUserId(user?.id ?? null);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Track user presence
  usePresence(userId);

  return (
    <>
      <ChatLayout
        sidebar={<ChatSidebar />}
        chatSection={<ChatSection />}
        isChatOpen={isChatSliderOpen}
        onCloseChat={toggleChatSlider}
      />

      {/* Profile sheet */}
      <SheetOverlay
        isOpen={isProfileOpen}
        onClose={toggleProfile}
        title={
          selectedConversation?.conversation.type === 'group'
            ? 'Group Room'
            : 'Profile'
        }
      >
        {selectedConversation?.conversation.type === 'group' ? (
          <ReceiverProfile
            isGroup
            conversationId={selectedConversation.conversation.id}
            avatar={selectedConversation.conversation.avatar_url || ''}
            name={selectedConversation.conversation.name || 'Group Room'}
            members={selectedConversation.members}
            currentUserId={userId}
          />
        ) : (
          selectedUser && (
            <ReceiverProfile
              avatar={selectedUser.avatar_url || ''}
              email={selectedUser.email}
              name={selectedUser.name}
              status={selectedUser.status}
            />
          )
        )}
      </SheetOverlay>
    </>
  );
}

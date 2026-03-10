'use client';

import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatSection } from '@/components/chat/chat-section';
import { ChatLayout } from '@/components/layout/chat-layout';
import { SheetOverlay } from '@/components/layout/sheet-overlay';
import { ChatHeader } from '@/components/chat/chat-header';
import { ReceiverProfile } from '@/components/chat/receiver-profile';
import { useChatStore } from '@/store/chat-store';
import { usePresence } from '@/hooks/use-realtime';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export function ChatPageClient() {
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);

  const {
    selectedUser,
    isChatSliderOpen,
    toggleChatSlider,
    isProfileOpen,
    toggleProfile,
  } = useChatStore();

  // Get user ID for presence
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, [supabase.auth]);

  // Track user presence
  usePresence(userId);

  return (
    <>
      <ChatLayout sidebar={<ChatSidebar />} chatSection={<ChatSection />} />

      {/* Mobile chat slider */}
      <SheetOverlay
        isOpen={isChatSliderOpen}
        onClose={toggleChatSlider}
        header={
          selectedUser ? (
            <ChatHeader
              avatar={selectedUser.avatar_url || ''}
              name={selectedUser.name}
              status={selectedUser.status}
              onProfileClick={toggleProfile}
            />
          ) : undefined
        }
      >
        <ChatSection withHeader={false} />
      </SheetOverlay>

      {/* Profile sheet */}
      <SheetOverlay isOpen={isProfileOpen} onClose={toggleProfile} title="Profile">
        {selectedUser && (
          <ReceiverProfile
            avatar={selectedUser.avatar_url || ''}
            email={selectedUser.email}
            name={selectedUser.name}
            status={selectedUser.status}
          />
        )}
      </SheetOverlay>
    </>
  );
}

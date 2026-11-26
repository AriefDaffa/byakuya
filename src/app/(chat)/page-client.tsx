'use client';

import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatSection } from '@/components/chat/chat-section';
import { ChatLayout } from '@/components/layout/chat-layout';
import { SheetOverlay } from '@/components/layout/sheet-overlay';
import { ReceiverProfile } from '@/components/chat/receiver-profile';
import { useChatStore } from '@/store/chat-store';
import { usePresence } from '@/hooks/use-realtime';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useMemo, useState } from 'react';

export function ChatPageClient() {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);

  const selectedUser = useChatStore((state) => state.selectedUser);
  const isChatSliderOpen = useChatStore((state) => state.isChatSliderOpen);
  const toggleChatSlider = useChatStore((state) => state.toggleChatSlider);
  const isProfileOpen = useChatStore((state) => state.isProfileOpen);
  const toggleProfile = useChatStore((state) => state.toggleProfile);

  // Get user ID for presence
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, [supabase]);

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

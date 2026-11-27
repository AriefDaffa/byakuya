'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useChatStore } from '@/store/chat-store';
import { useRealtimeMessages, useTypingIndicator } from '@/hooks/use-realtime';
import { playReactionSfx, playReceiveSfx, playSendSfx } from '@/lib/sound';
import { getMe } from '@/features/auth/actions';
import {
  getMessages,
  sendMessage as sendMessageAction,
  sendAttachment as sendAttachmentAction,
  editMessage as editMessageAction,
  deleteMessage as deleteMessageAction,
  markAsRead,
  togglePinMessage as togglePinMessageAction,
  toggleReaction as toggleReactionAction,
} from '@/features/chat/actions';
import type { Profile } from '@/types/database';
import type { MessageWithSender, MessageGroup, ReactionSummary } from '@/types/chat';

const EMPTY_MESSAGES: MessageWithSender[] = [];

function createPlaceholderSender(senderId: string): Profile {
  return {
    id: senderId,
    name: '',
    email: '',
    avatar_url: null,
    status: null,
    last_seen: null,
    created_at: '',
    updated_at: '',
  };
}

export function useChatRoom() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loadedConversationId, setLoadedConversationId] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const requestSequenceRef = useRef(0);
  const previewUrlsRef = useRef<Set<string>>(new Set());

  const {
    conversationId,
    messageInput,
    setMessageInput,
    page,
    setEditingMessage,
    replyingTo,
    setReplyingTo,
    messages,
    setMessages,
    hasMore,
    setHasMore,
  } = useChatStore();

  const { typingUsers, sendTyping } = useTypingIndicator(conversationId, currentUserId);

  // Get current user ID
  useEffect(() => {
    let cancelled = false;

    void getMe()
      .then((profile) => {
        if (!cancelled) {
          setCurrentUserId(profile?.id ?? null);
        }
      })
      .catch((error: unknown) => {
        console.error('Failed to resolve current user:', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch messages when the conversation or page changes. A monotonically
  // increasing request id (plus a conversation check) guarantees that a slow
  // response for a conversation that is no longer active can never overwrite
  // the active conversation's messages.
  useEffect(() => {
    if (!conversationId) {
      requestSequenceRef.current += 1;
      return;
    }

    const requestId = ++requestSequenceRef.current;

    const isCurrentRequest = () =>
      requestId === requestSequenceRef.current &&
      useChatStore.getState().conversationId === conversationId;

    void getMessages(conversationId, page)
      .then((result) => {
        if (!isCurrentRequest()) return;

        if ('error' in result && result.error) {
          console.error('Failed to fetch messages:', result.error);
          setMessages([]);
          setHasMore(false);
          setLoadedConversationId(conversationId);
          setCurrentPage(page);
          return;
        }

        const typed = (result.data || []) as MessageWithSender[];

        if (page === 1) {
          setMessages(typed);
        } else {
          // Prepend older messages while de-duplicating by id.
          setMessages((previous) => {
            const existingIds = new Set(previous.map((message) => message.id));
            const older = typed.filter((message) => !existingIds.has(message.id));
            return [...older, ...previous];
          });
        }

        setTotalPages(result.totalPages);
        setCurrentPage(result.currentPage);
        setHasMore(result.currentPage < result.totalPages);
        setLoadedConversationId(conversationId);
      })
      .catch((error: unknown) => {
        if (!isCurrentRequest()) return;
        console.error('Failed to fetch messages:', error);
        setMessages([]);
        setHasMore(false);
        setLoadedConversationId(conversationId);
        setCurrentPage(page);
      });

    return () => {
      // Invalidate in-flight responses for this effect run.
      requestSequenceRef.current += 1;
    };
  }, [conversationId, page, setMessages, setHasMore]);

  // Mark as read when opening a conversation
  useEffect(() => {
    if (conversationId) {
      void markAsRead(conversationId);
    }
  }, [conversationId]);

  // Realtime insert/update events merge into the message list by id. The SSE
  // payload already includes the sender profile and attachments, and own
  // messages from another tab are included because we no longer skip events
  // based on `sender_id`.
  const mergeMessage = useCallback(
    (message: MessageWithSender) => {
      if (!conversationId || message.conversation_id !== conversationId) return;

      setMessages((previous) => {
        const index = previous.findIndex((item) => item.id === message.id);

        if (index === -1) {
          return [...previous, message];
        }

        const next = [...previous];
        next[index] = {
          ...previous[index],
          ...message,
          sender: message.sender ?? previous[index].sender,
          attachments: message.attachments ?? previous[index].attachments,
        };
        return next;
      });
    },
    [conversationId, setMessages],
  );

  const handleNewMessage = useCallback(
    (message: MessageWithSender) => {
      mergeMessage(message);

      if (message.sender_id !== currentUserId) {
        playReceiveSfx();
      }

      if (conversationId) {
        void markAsRead(conversationId);
      }
    },
    [conversationId, currentUserId, mergeMessage],
  );

  const handleMessageUpdate = useCallback(
    (message: MessageWithSender) => {
      mergeMessage(message);
    },
    [mergeMessage],
  );

  const handleMessageDelete = useCallback(
    (messageId: string) => {
      setMessages((previous) => previous.filter((item) => item.id !== messageId));
    },
    [setMessages],
  );

  const handleReactionToggle = useCallback(
    (messageId: string, reactions: ReactionSummary[]) => {
      setMessages((previous) =>
        previous.map((item) =>
          item.id === messageId ? { ...item, reactions } : item,
        ),
      );
    },
    [setMessages],
  );

  const handleMessagePin = useCallback(
    (
      messageId: string,
      isPinned: boolean,
      pinnedAt: string | null,
      pinnedBy: string | null,
    ) => {
      setMessages((previous) =>
        previous.map((item) =>
          item.id === messageId
            ? { ...item, is_pinned: isPinned, pinned_at: pinnedAt, pinned_by: pinnedBy }
            : item,
        ),
      );
    },
    [setMessages],
  );

  useRealtimeMessages({
    conversationId,
    onNewMessage: handleNewMessage,
    onMessageUpdate: handleMessageUpdate,
    onMessageDelete: handleMessageDelete,
    onReactionToggle: handleReactionToggle,
    onMessagePin: handleMessagePin,
  });

  // Send message
  const sendMessage = useCallback(async () => {
    if (!conversationId || !currentUserId) return;

    const content = messageInput.trim();
    if (!content) return;

    const currentReply = replyingTo;
    setMessageInput('');
    setReplyingTo(null);
    sendTyping(false);
    playSendSfx();

    // Optimistic update
    const optimisticMsg: MessageWithSender = {
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      sender_id: currentUserId,
      content,
      type: 'text',
      is_edited: false,
      is_deleted: false,
      reply_to_id: currentReply?.id ?? null,
      replyTo: currentReply,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender: createPlaceholderSender(currentUserId),
    };

    setMessages((previous) => [...previous, optimisticMsg]);

    const result = await sendMessageAction(
      conversationId,
      content,
      currentReply?.id ?? null,
    );

    if (result.error) {
      setMessages((previous) =>
        previous.filter((message) => message.id !== optimisticMsg.id),
      );
      setMessageInput(content);
      setReplyingTo(currentReply);
      toast.error(result.error);
      return;
    }

    if (result.data) {
      const saved = result.data as MessageWithSender;
      setMessages((previous) => {
        const withoutOptimistic = previous.filter(
          (message) => message.id !== optimisticMsg.id && message.id !== saved.id,
        );
        return [...withoutOptimistic, saved];
      });
    }
  }, [
    conversationId,
    messageInput,
    currentUserId,
    replyingTo,
    setMessageInput,
    setReplyingTo,
    setMessages,
    sendTyping,
  ]);

  // Send attachment
  const sendAttachment = useCallback(
    async (file: File, caption?: string) => {
      if (!conversationId || !currentUserId) return;

      const previousInput = messageInput;
      const formData = new FormData();
      formData.append('file', file);

      const isImage = file.type.startsWith('image/');
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.add(previewUrl);

      const revokePreview = () => {
        if (previewUrlsRef.current.has(previewUrl)) {
          URL.revokeObjectURL(previewUrl);
          previewUrlsRef.current.delete(previewUrl);
        }
      };

      // Optimistic update
      const optimisticMsg: MessageWithSender = {
        id: crypto.randomUUID(),
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: caption || file.name,
        type: isImage ? 'image' : 'file',
        is_edited: false,
        is_deleted: false,
        reply_to_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sender: createPlaceholderSender(currentUserId),
        attachments: [
          {
            id: crypto.randomUUID(),
            message_id: '',
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_url: previewUrl,
            storage_path: '',
            created_at: new Date().toISOString(),
          },
        ],
      };

      setMessages((previous) => [...previous, optimisticMsg]);

      const result = await sendAttachmentAction(conversationId, formData, caption);

      if (result.error) {
        revokePreview();
        setMessages((previous) =>
          previous.filter((message) => message.id !== optimisticMsg.id),
        );
        setMessageInput(previousInput);
        toast.error(result.error);
        return;
      }

      if (result.data) {
        revokePreview();
        const saved = result.data as MessageWithSender;
        setMessages((previous) => {
          const withoutOptimistic = previous.filter(
            (message) => message.id !== optimisticMsg.id && message.id !== saved.id,
          );
          return [...withoutOptimistic, saved];
        });
      }
    },
    [conversationId, currentUserId, messageInput, setMessageInput, setMessages],
  );

  // Edit message
  const editMessage = useCallback(
    async (messageId: string, newContent: string) => {
      const result = await editMessageAction(messageId, newContent);

      if (result.error) {
        console.error('Failed to edit message:', result.error);
        toast.error(result.error);
        return false;
      }

      if (result.data) {
        const updated = result.data as MessageWithSender;
        setMessages((previous) =>
          previous.map((message) =>
            message.id === messageId ? { ...message, ...updated } : message,
          ),
        );
      }

      setEditingMessage(null);
      return true;
    },
    [setEditingMessage, setMessages],
  );

  // Delete message
  const deleteMessage = useCallback(
    async (messageId: string) => {
      const result = await deleteMessageAction(messageId);

      if (result.error) {
        console.error('Failed to delete message:', result.error);
        toast.error(result.error);
        return false;
      }

      // Update message in list (soft delete - show "deleted" state)
      setMessages((previous) =>
        previous.map((message) =>
          message.id === messageId
            ? { ...message, is_deleted: true, content: null }
            : message,
        ),
      );

      return true;
    },
    [setMessages],
  );

  // Toggle emoji reaction
  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    playReactionSfx();
    const result = await toggleReactionAction(messageId, emoji);
    if (result.error) {
      toast.error(result.error);
      return false;
    }
    if (result.data) {
      setMessages((previous) =>
        previous.map((item) =>
          item.id === messageId ? { ...item, reactions: result.data } : item,
        ),
      );
    }
    return true;
  }, [setMessages]);

  // Toggle message pin
  const togglePin = useCallback(async (messageId: string) => {
    const result = await togglePinMessageAction(messageId);
    if (result.error) {
      toast.error(result.error);
      return false;
    }
    if (result.data) {
      setMessages((previous) =>
        previous.map((item) =>
          item.id === messageId
            ? {
                ...item,
                is_pinned: result.data.isPinned,
                pinned_at: result.data.pinnedAt,
                pinned_by: result.data.pinnedBy,
              }
            : item,
        ),
      );
      toast.success(result.data.isPinned ? 'Message pinned' : 'Message unpinned');
    }
    return true;
  }, [setMessages]);

  // Revoke any remaining optimistic preview URLs on unmount.
  useEffect(() => {
    const previewUrls = previewUrlsRef.current;

    return () => {
      for (const url of previewUrls) {
        URL.revokeObjectURL(url);
      }
      previewUrls.clear();
    };
  }, []);

  // Group messages by sender within 1-minute windows
  const formatMessages = useCallback((msgs: MessageWithSender[]): MessageGroup[] => {
    if (!msgs.length) return [];

    const sorted = [...msgs].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

    const groups: MessageGroup[] = [];

    for (const message of sorted) {
      const lastGroup = groups[groups.length - 1];
      const messageTime = new Date(message.created_at).getTime();

      if (lastGroup && lastGroup.senderId === message.sender_id) {
        const lastMsg = lastGroup.messages[lastGroup.messages.length - 1];
        const lastTime = new Date(lastMsg.created_at).getTime();

        if (messageTime - lastTime <= 60_000) {
          lastGroup.messages.push(message);
          continue;
        }
      }

      groups.push({
        senderId: message.sender_id,
        senderName: message.sender?.name || '',
        senderAvatar: message.sender?.avatar_url || null,
        messages: [message],
      });
    }

    return groups;
  }, []);

  const isConversationLoaded =
    conversationId !== null && loadedConversationId === conversationId;
  const isLoading = conversationId !== null && !isConversationLoaded;
  const isFetching = isConversationLoaded && page > currentPage;
  const visibleMessages = isConversationLoaded ? messages : EMPTY_MESSAGES;
  const messageGroups = useMemo(
    () => formatMessages(visibleMessages),
    [formatMessages, visibleMessages],
  );

  return useMemo(
    () => ({
      messages: visibleMessages,
      messageGroups,
      isLoading,
      isFetching,
      totalPages,
      currentPage,
      hasMore,
      currentUserId,
      typingUsers,
      sendTyping,
      sendMessage,
      sendAttachment,
      editMessage,
      deleteMessage,
      toggleReaction,
      togglePin,
    }),
    [
      visibleMessages,
      messageGroups,
      isLoading,
      isFetching,
      totalPages,
      currentPage,
      hasMore,
      currentUserId,
      typingUsers,
      sendTyping,
      sendMessage,
      sendAttachment,
      editMessage,
      deleteMessage,
      toggleReaction,
      togglePin,
    ],
  );
}

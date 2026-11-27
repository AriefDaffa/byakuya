-- ============================================================================
-- Byakuya Chat Application - Feature Extensions (Reactions & Pinned Messages)
-- Idempotent migration for existing PostgreSQL databases.
-- ============================================================================

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pinned_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_messages_pinned
  ON public.messages (conversation_id, pinned_at DESC)
  WHERE is_pinned = TRUE;

CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message
  ON public.message_reactions (message_id);

CREATE INDEX IF NOT EXISTS idx_message_reactions_user
  ON public.message_reactions (user_id);

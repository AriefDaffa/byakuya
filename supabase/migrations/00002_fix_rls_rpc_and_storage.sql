-- ============================================================================
-- Byakuya Refactor - Migration 00002
-- Fixes RLS recursion, ambiguous correlated columns, privilege escalation,
-- SECURITY DEFINER hardening, and private attachments storage bucket + policies.
-- ============================================================================

-- 1. SECURITY DEFINER membership helper (breaks RLS recursion)
CREATE OR REPLACE FUNCTION public.is_conversation_member(conv_id UUID, uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_members cm
    WHERE cm.conversation_id = conv_id
      AND cm.user_id = uid
  );
$$;

REVOKE ALL ON FUNCTION public.is_conversation_member(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_conversation_member(UUID, UUID) TO authenticated;

-- 2. Harden handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'avatar_url'), '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 3. Make conversation timestamp trigger SECURITY DEFINER so RLS on conversations works
CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

-- 4. Harden get_or_create_private_conversation RPC
CREATE OR REPLACE FUNCTION public.get_or_create_private_conversation(
  user1_id UUID,
  user2_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  conv_id UUID;
  lock_key BIGINT;
BEGIN
  IF auth.uid() IS NULL OR user1_id <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: user1_id must match authenticated user';
  END IF;

  IF user1_id = user2_id THEN
    RAISE EXCEPTION 'Cannot create a private conversation with yourself';
  END IF;

  -- Serialize concurrent DM creation for the same unordered user pair
  lock_key := hashtext(
    LEAST(user1_id::text, user2_id::text) || ':' || GREATEST(user1_id::text, user2_id::text)
  );
  PERFORM pg_advisory_xact_lock(lock_key);

  SELECT c.id INTO conv_id
  FROM public.conversations c
  WHERE c.type = 'private'
    AND EXISTS (
      SELECT 1 FROM public.conversation_members cm1
      WHERE cm1.conversation_id = c.id AND cm1.user_id = user1_id
    )
    AND EXISTS (
      SELECT 1 FROM public.conversation_members cm2
      WHERE cm2.conversation_id = c.id AND cm2.user_id = user2_id
    )
    AND (
      SELECT COUNT(*) FROM public.conversation_members cm_all
      WHERE cm_all.conversation_id = c.id
    ) = 2
  LIMIT 1;

  IF conv_id IS NULL THEN
    INSERT INTO public.conversations (type) VALUES ('private') RETURNING id INTO conv_id;
    INSERT INTO public.conversation_members (conversation_id, user_id)
    VALUES (conv_id, user1_id), (conv_id, user2_id);
  END IF;

  RETURN conv_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_or_create_private_conversation(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_or_create_private_conversation(UUID, UUID) TO authenticated;

-- 5. Replace broken RLS policies

-- CONVERSATIONS
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;

CREATE POLICY "Users can view their conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (public.is_conversation_member(id, auth.uid()));

-- CONVERSATION_MEMBERS
DROP POLICY IF EXISTS "Users can view members of their conversations" ON public.conversation_members;
DROP POLICY IF EXISTS "Users can insert conversation members" ON public.conversation_members;
DROP POLICY IF EXISTS "Users can update their own membership" ON public.conversation_members;

CREATE POLICY "Users can view members of their conversations"
  ON public.conversation_members FOR SELECT
  TO authenticated
  USING (public.is_conversation_member(conversation_id, auth.uid()));

CREATE POLICY "Users can update their own membership"
  ON public.conversation_members FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_conversation_member(conversation_id, auth.uid())
  );

CREATE POLICY "Users can leave conversations"
  ON public.conversation_members FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- MESSAGES
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  TO authenticated
  USING (public.is_conversation_member(messages.conversation_id, auth.uid()));

CREATE POLICY "Users can send messages to their conversations"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_conversation_member(messages.conversation_id, auth.uid())
  );

CREATE POLICY "Users can update their own messages"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (
    sender_id = auth.uid()
    AND public.is_conversation_member(messages.conversation_id, auth.uid())
  )
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_conversation_member(messages.conversation_id, auth.uid())
  );

CREATE POLICY "Users can delete their own messages"
  ON public.messages FOR DELETE
  TO authenticated
  USING (
    sender_id = auth.uid()
    AND public.is_conversation_member(messages.conversation_id, auth.uid())
  );

-- ATTACHMENTS
DROP POLICY IF EXISTS "Users can view attachments in their conversations" ON public.attachments;
DROP POLICY IF EXISTS "Users can insert attachments for their messages" ON public.attachments;

CREATE POLICY "Users can view attachments in their conversations"
  ON public.attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = attachments.message_id
        AND public.is_conversation_member(m.conversation_id, auth.uid())
    )
  );

CREATE POLICY "Users can insert attachments for their messages"
  ON public.attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = attachments.message_id
        AND m.sender_id = auth.uid()
        AND public.is_conversation_member(m.conversation_id, auth.uid())
    )
  );

-- NOTIFICATIONS (service_role bypasses RLS; remove open authenticated INSERT)
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

-- TYPING INDICATORS
DROP POLICY IF EXISTS "Users can view typing in their conversations" ON public.typing_indicators;
DROP POLICY IF EXISTS "Users can manage their own typing indicator" ON public.typing_indicators;
DROP POLICY IF EXISTS "Users can delete their own typing indicator" ON public.typing_indicators;

CREATE POLICY "Users can view typing in their conversations"
  ON public.typing_indicators FOR SELECT
  TO authenticated
  USING (public.is_conversation_member(typing_indicators.conversation_id, auth.uid()));

CREATE POLICY "Users can insert their own typing indicator"
  ON public.typing_indicators FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_conversation_member(typing_indicators.conversation_id, auth.uid())
  );

CREATE POLICY "Users can update their own typing indicator"
  ON public.typing_indicators FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND public.is_conversation_member(typing_indicators.conversation_id, auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_conversation_member(typing_indicators.conversation_id, auth.uid())
  );

CREATE POLICY "Users can delete their own typing indicator"
  ON public.typing_indicators FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 6. Storage bucket & object policies for private attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Members can view conversation attachments" ON storage.objects;
DROP POLICY IF EXISTS "Members can upload conversation attachments" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete their attachments" ON storage.objects;

CREATE POLICY "Members can view conversation attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'attachments'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR CASE
        WHEN (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
        THEN public.is_conversation_member(((storage.foldername(name))[1])::uuid, auth.uid())
        ELSE FALSE
      END
    )
  );

CREATE POLICY "Members can upload conversation attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'attachments'
    AND CASE
      WHEN (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      THEN public.is_conversation_member(((storage.foldername(name))[1])::uuid, auth.uid())
      ELSE FALSE
    END
  );

CREATE POLICY "Owners can delete their attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'attachments'
    AND (owner_id = auth.uid()::text OR owner = auth.uid())
  );

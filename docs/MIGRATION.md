# Migration Guide: ElysiaJS → Supabase Architecture

## Overview

This document describes the architectural migration from the old stack (Next.js + ElysiaJS + socket.io + better-auth + Prisma) to the new stack (Next.js + Supabase).

---

## Architecture Comparison

| Concern | Old Stack | New Stack |
|---|---|---|
| **Backend API** | ElysiaJS (custom server) | Supabase + Server Actions |
| **Authentication** | better-auth (cookie-based) | Supabase Auth |
| **Database** | Prisma ORM | Supabase PostgreSQL (direct) |
| **Realtime** | socket.io WebSockets | Supabase Realtime (Postgres Changes) |
| **File Storage** | Local/custom | Supabase Storage |
| **Authorization** | Middleware + custom | Row Level Security (RLS) |

---

## Migration Steps

### 1. Create Supabase Project

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>
```

### 2. Run Database Migration

```bash
# Push the initial schema to your Supabase project
supabase db push

# Or apply migrations
supabase migration up
```

The migration file at `supabase/migrations/00001_initial_schema.sql` creates:
- **profiles** — user profiles (auto-created on signup via trigger)
- **conversations** — chat conversations (private/group)
- **conversation_members** — many-to-many relationship
- **messages** — chat messages with conversation reference
- **attachments** — file attachments for messages
- **notifications** — user notifications
- **typing_indicators** — ephemeral typing status

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Required variables:
- `NEXT_PUBLIC_SUPABASE_URL` — Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Public anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (server-side only)

Find these in your Supabase Dashboard → Settings → API.

### 4. Install Dependencies

```bash
npm install
```

### 5. Migrate Existing Data

If you have existing data from the old system, you'll need to:

#### Users
1. Export users from better-auth database
2. Create corresponding Supabase Auth users via the Admin API:
   ```ts
   const { data, error } = await supabase.auth.admin.createUser({
     email: oldUser.email,
     password: 'temporary-password',
     email_confirm: true,
     user_metadata: { name: oldUser.name }
   });
   ```
3. The `handle_new_user()` trigger will auto-create profile records

#### Messages & Conversations
1. Export conversations and messages from old database
2. Insert into Supabase tables using the service role client:
   ```ts
   const supabase = createClient(url, serviceRoleKey);
   await supabase.from('conversations').insert(conversations);
   await supabase.from('messages').insert(messages);
   ```

---

## Key Architectural Changes

### Authentication Flow

**Old:** `better-auth` with cookie-based sessions, custom middleware checking `api/auth/get-session`

**New:** Supabase Auth with `@supabase/ssr` for cookie management:
- `src/lib/supabase/client.ts` — Browser client
- `src/lib/supabase/server.ts` — Server client (uses cookies)
- `src/lib/supabase/middleware.ts` — Session refresh middleware
- `src/middleware.ts` — Route protection

### API Layer

**Old:** ElysiaJS routes called via `fetch` from service files (`services/getChatList.ts`, etc.)

**New:** Server Actions in `src/features/`:
- `src/features/auth/actions.ts` — `signIn`, `signUp`, `signOut`, `getSession`, `getProfile`
- `src/features/chat/actions.ts` — `sendMessage`, `getMessages`, `getChatList`, `searchUsers`, etc.

### Realtime

**Old:** socket.io client (`lib/socket.ts`) with manual event listeners

**New:** Supabase Realtime hooks (`src/hooks/use-realtime.ts`):
- `useRealtimeMessages` — Listen for new messages in a conversation
- `useRealtimeNotifications` — Listen for user notifications
- `useRealtimeConversations` — Listen for conversation updates
- `useRealtimeTyping` — Listen for typing indicators
- `usePresence` — Track online/offline status

### State Management

**Old:** Zustand stores with direct socket.io integration

**New:** Zustand stores (simplified) + TanStack React Query for server state caching:
- `src/store/chat-store.ts` — UI state (selected user, conversation, panels)
- `src/store/chat-list-store.ts` — Chat list state

### Authorization

**Old:** Custom middleware checking auth cookies

**New:** PostgreSQL Row Level Security (RLS) policies:
- Users can only read/write their own profile
- Users can only access conversations they're members of
- Users can only read/send messages in their conversations
- All policies defined in the migration SQL

### Component Structure

**Old:** Atomic Design (atoms → molecules → organisms → templates)

**New:** Feature-based organization:
```
src/components/
  ui/          — Base UI components (avatar, button, etc.)
  chat/        — Chat feature components
  auth/        — Auth feature components
  layout/      — Layout components
```

---

## File Mapping (Old → New)

| Old File | New File | Notes |
|---|---|---|
| `lib/auth-client.ts` | `src/lib/supabase/client.ts` | Supabase replaces better-auth |
| `lib/socket.ts` | `src/hooks/use-realtime.ts` | Supabase Realtime replaces socket.io |
| `lib/utils.ts` | `src/lib/utils.ts` | Same cn() utility |
| `services/getChatList.ts` | `src/features/chat/actions.ts` | Server Action |
| `services/getMessages.ts` | `src/features/chat/actions.ts` | Server Action |
| `services/searchUser.ts` | `src/features/chat/actions.ts` | Server Action |
| `services/searchMessages.ts` | `src/features/chat/actions.ts` | Server Action |
| `store/useChatStore.ts` | `src/store/chat-store.ts` | Simplified |
| `store/useChatListStore.ts` | `src/store/chat-list-store.ts` | Simplified |
| `hooks/useChatRoom.ts` | `src/hooks/use-chat-room.ts` | Uses Supabase |
| `hooks/useChatList.ts` | `src/hooks/use-chat-list.ts` | Uses Supabase |
| `hooks/useChatSearch.ts` | `src/hooks/use-chat-search.ts` | Uses Supabase |
| `middleware.ts` | `src/middleware.ts` | Supabase session |
| `app/layout.tsx` | `src/app/layout.tsx` | Same structure |
| `app/providers.tsx` | `src/app/providers.tsx` | + QueryClient |

---

## Removed Dependencies

| Package | Reason |
|---|---|
| `better-auth` | Replaced by Supabase Auth |
| `socket.io-client` | Replaced by Supabase Realtime |
| `@prisma/client` / `prisma` | Replaced by Supabase direct queries |
| `bcryptjs` | Supabase handles password hashing |
| `uuid` | Supabase uses `gen_random_uuid()` |
| `@mantine/hooks` | Replaced by custom hooks |

## Added Dependencies

| Package | Purpose |
|---|---|
| `@supabase/supabase-js` | Supabase client |
| `@supabase/ssr` | Server-side Supabase with cookie management |
| `@tanstack/react-query` | Server state caching |
| `vitest` | Unit/component testing |
| `@testing-library/react` | Component testing |
| `prettier` | Code formatting |
| `prettier-plugin-tailwindcss` | Tailwind class sorting |

# Byakuya

Modern realtime chat application built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Zustand, and Supabase (Auth, PostgreSQL + RLS, Realtime, and Private Storage).

## Prerequisites

- **Node.js** `>= 20.9.0`
- **Supabase** project (or local Supabase CLI)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the environment template and fill in your Supabase credentials:
   ```bash
   cp .env.example .env.local
   ```
3. Push database migrations (`00001_initial_schema.sql` and `00002_fix_rls_rpc_and_storage.sql`):
   ```bash
   supabase db push
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` — Start Next.js dev server (Turbopack)
- `npm run build` — Production build
- `npm run type-check` — TypeScript check (`tsc --noEmit`)
- `npm run lint` — ESLint (`eslint .`)
- `npm run format:check` — Prettier formatting check
- `npx vitest run` — Run unit/component tests once (`npm test` runs watch mode)
- `npm run test:coverage` — Run Vitest with V8 coverage
- `npm run test:e2e` — Run Playwright E2E tests (`./e2e`)

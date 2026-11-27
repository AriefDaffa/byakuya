# Byakuya

16-bit pixel-themed realtime chat application built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Zustand, and PostgreSQL (Docker).

## Features

- **16-bit Pixel OS UI:** Classic desktop/mobile window chrome, notched pixel speech bubbles with directional tails, deterministic 16×16 RPG portrait avatars, custom `crispEdges` pixel icons, and light/dark theme support.
- **Custom Authentication:** PostgreSQL-backed user accounts with `scrypt` password hashing, signed `jose` JWT session cookies, and Next.js `proxy.ts` route protection.
- **Realtime Chat & Attachments:** Server-Sent Events (`/api/realtime`) for live message delivery, editing, deletion, and unread counts, plus local file/image attachment uploads served via `/api/attachments/[id]`.

## Prerequisites

- **Node.js** `>= 20.9.0`
- **Docker** (for local PostgreSQL)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```
3. Start PostgreSQL in Docker (automatically initializes `db/init/001_schema.sql`):
   ```bash
   npm run db:up
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

- `npm run dev` — Start Next.js dev server (Turbopack)
- `npm run build` — Production build
- `npm run type-check` — TypeScript check (`tsc --noEmit`)
- `npm run lint` — ESLint (`eslint .`)
- `npm run format:check` — Prettier formatting check
- `npx vitest run` — Run unit/component tests once (`npm test` runs watch mode)
- `npm run test:coverage` — Run Vitest with V8 coverage
- `npm run test:e2e` — Run Playwright E2E tests (`./e2e`)
- `npm run db:up` / `npm run db:down` / `npm run db:psql` — Manage Docker PostgreSQL

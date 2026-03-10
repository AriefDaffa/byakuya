# Deployment Guide

## Prerequisites

- Node.js 18+ 
- A Supabase project (free tier works for development)
- Vercel account (recommended) or any Node.js hosting

---

## Environment Setup

### Supabase Project

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service role key → `SUPABASE_SERVICE_ROLE_KEY`

### Database Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Login and link
supabase login
supabase link --project-ref <your-project-ref>

# Apply migrations
supabase db push
```

### Enable Realtime

In the Supabase Dashboard:
1. Go to **Database → Replication**
2. Enable replication for these tables:
   - `messages`
   - `notifications`
   - `typing_indicators`
   - `conversations`
   - `conversation_members`

> The migration SQL includes `alter publication supabase_realtime add table ...` statements that handle this automatically, but verify in the dashboard.

---

## Deployment Options

### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

Or connect your GitHub repository in the Vercel dashboard for automatic deployments.

**Vercel Settings:**
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### Option B: Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

> Note: For Docker deployment, add `output: 'standalone'` back to `next.config.ts`.

### Option C: Self-hosted (PM2)

```bash
# Build
npm run build

# Start with PM2
pm2 start npm --name "byakuya" -- start
```

---

## CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
```

---

## Supabase Production Checklist

- [ ] Enable email confirmations in **Auth → Settings**
- [ ] Configure allowed redirect URLs in **Auth → URL Configuration**
- [ ] Review and tighten RLS policies for production
- [ ] Set up database backups (automatic on Pro plan)
- [ ] Enable Point-in-Time Recovery (Pro plan)
- [ ] Configure rate limiting in **Auth → Rate Limits**
- [ ] Set up custom SMTP for transactional emails
- [ ] Monitor usage in the Supabase Dashboard
- [ ] Set up alerts for quota limits

---

## Performance Considerations

1. **Database Indexes** — The migration includes indexes on:
   - `messages(conversation_id, created_at)` for paginated message queries
   - `messages(conversation_id, sender_id)` for sender lookups
   - `conversation_members(user_id)` for user conversation lists
   - `profiles` with `pg_trgm` GIN index for fuzzy name search

2. **Connection Pooling** — Supabase uses PgBouncer by default. Use the pooled connection string for serverless environments.

3. **Edge Functions** — Consider moving heavy operations to Supabase Edge Functions if needed.

4. **Caching** — TanStack Query handles client-side caching with configurable `staleTime` and `gcTime`.

---

## Monitoring

- **Supabase Dashboard** — Database metrics, auth logs, realtime connections
- **Vercel Analytics** — Web vitals, function execution times
- **Error Tracking** — Consider adding Sentry for production error monitoring:
  ```bash
  npm install @sentry/nextjs
  npx @sentry/wizard@latest -i nextjs
  ```

# Byakuya Project Rules

## Tech Stack & Verification

- **Framework:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Supabase, Vitest, Playwright.
- **Verification commands** (from `package.json`):
  - Typecheck: `npm run type-check`
  - Lint: `npm run lint`
  - Format check: `npm run format:check`
  - Unit/component tests: `npx vitest run` (note: `npm test` runs `vitest` in watch mode)
  - E2E tests: `npm run test:e2e`
  - Build: `npm run build`

## Planning & Orchestration

- For non-trivial features, refactors, or multi-file changes, activate the `plan-and-orchestrate` skill in `.agents/skills/plan-and-orchestrate/SKILL.md` and get plan approval before editing code.
- **Model Delegation:** Use **Gemini 4 Hydrogen** (`antigravity`) as the coordinator/architect and **DeepSeek V4.1 Flash** (`providerInstanceId: "opencode"`, `model: "opencode-go/deepseek-v4.1-flash"`) via `delegate_task` for delegated research, scoped implementation slices, and diff reviews.

---
name: plan-and-orchestrate
description: >-
  Use this skill before implementing non-trivial features, refactors, or
  multi-file changes to gather requirements, check required domain skills,
  create an approved plan, and orchestrate execution with DeepSeek V4.1 Flash
  (opencode-go/deepseek-v4.1-flash) via T3 delegate_task.
---

# Plan and Orchestrate

Follow this 4-phase workflow strictly. **Do not edit implementation files during Phases 1 and 2.**

## Phase 1: Requirement Gathering & Discovery (Read-Only)

1. **Clarify Requirements:** Ask concise questions if scope, acceptance criteria, UX, or data/API behavior is ambiguous.
2. **Check Required Skills:** Identify any domain skills relevant to the task (e.g., frontend/UI skills when touching components) and read their `SKILL.md` before planning.
3. **Codebase Discovery:**
   - Read entrypoints, configs, and directly relevant files.
   - For broad exploration across many files, call `orchestrator_capabilities` (once per thread) and delegate read-only research via `delegate_task` (`role: "research"`, `target: { providerInstanceId: "opencode", model: "opencode-go/deepseek-v4.1-flash" }`).

## Phase 2: Planning & Breakdown (Approval Gate)

Produce a concrete plan (in chat, or in `docs/plans/YYYY-MM-DD-<topic>.md` for large initiatives) containing:

1. **Objective & Non-Goals:** Clear scope boundaries.
2. **Dependency Order & Affected Files:** Exact files to create or modify (e.g., `supabase/` schema/types -> `src/lib/` -> API/actions -> UI components -> tests).
3. **Atomic Tasks:** Small, verifiable units labeled **sequential** or **parallel-safe**.
4. **Verification Strategy:** Exact commands to run after execution (`npm run type-check`, `npm run lint`, `npx vitest run <targets>`, `npm run build` as applicable).

_Optional:_ Delegate a quick plan sanity-check to `opencode-go/deepseek-v4.1-flash` to catch missing edge cases or hidden dependencies.

**Gate:** Present the plan and **wait for user approval** before moving to Phase 3.

## Phase 3: Delegated Execution

1. Dispatch well-scoped tasks to `opencode-go/deepseek-v4.1-flash` via `delegate_task`:
   - Use `isolation: "worktree"` when multiple workers edit concurrently.
   - Use `isolation: "shared"` for sequential slices or a single worker.
   - Include exact file paths, relevant skill/repo conventions, and required tests in each brief.
2. As coordinator, integrate worktree changes, handle cross-cutting glue, and fix small issues directly without spawning extra delegates.

## Phase 4: Review & Verification (Done Gate)

1. **Optional Diff Review:** Launch a fresh `delegate_task` (`role: "review"`, `opencode-go/deepseek-v4.1-flash`) on the final diff to check for bugs, regressions, or missing tests.
2. **Run Checks:** Execute the verification commands from Phase 2 after the final edit.
3. **Report:** Summarize only directly observed changes, file paths, and command results.

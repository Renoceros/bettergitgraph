# BetterGitGraph Agent Context

## Last Updated
2026-08-24 — Initial scaffold by Antigravity agent (session: 334478c4)

## Current State
- **Branch:** main
- **Last Milestone Completed:** M0 — Project scaffold ✅
- **Next Milestone:** M1 — Git Data Layer (unit tests + simple-git integration hardening)

## What's Working
- [x] M0 — Full project scaffold committed and pushed to GitHub
- [x] Extension manifest (`package.json`) with all commands, keybindings, views, settings
- [x] TypeScript configs (host + webview split)
- [x] esbuild host bundler
- [x] Vite webview bundler config
- [x] ESLint flat config (v9)
- [x] `GitDataLayer` — full implementation with typed interfaces
- [x] `WebviewManager` — panel lifecycle + postMessage protocol
- [x] `BranchExplorerProvider` — recursive remote ref file tree
- [x] `BranchColorEngine` — FNV-1a deterministic colors
- [x] `.vscode/` — launch, tasks, extensions
- [x] `.github/workflows/ci.yml` — lint + build + test pipeline
- [x] `Documentation/` — PRD and TECH_DOCS in repo
- [ ] M1 — Unit tests for GitDataLayer
- [ ] M2 — DAG Layout Engine (dagre)
- [ ] M3 — React webview shell (replace placeholder)

## Active Design Decisions
- Using **FNV-1a** (not SHA-256) for branch color hashing — see ADR-001
- **Canvas API** (not SVG) for graph rendering — see ADR-002
- **Dagre** for layout — see ADR-003
- Extension host and webview are **separate TypeScript projects** (`tsconfig.json` vs `tsconfig.webview.json`)

## Known Issues / TODOs
- [ ] `resources/icon.png` placeholder needed before marketplace publish
- [ ] `test-fixtures/sample-repo` needs to be created for integration tests
- [ ] `src/extension/operation-executor.ts` not yet implemented (M5)
- [ ] Webview `src/webview/main.tsx` is a placeholder — full React app in M3
- [ ] Vite build deps (React, Zustand, dagre) not yet installed

## Agent Instructions

> [!IMPORTANT]
> Read `.agent/AGENT_PROTOCOL.md` before your first session. It is the law.
> It defines: session lifecycle, branch workflow, testing protocol, bug catching, PR rules, taboos, and emergency procedures.

When starting a new session on this repo:
1. **Read this file first** — understand current state before touching anything.
2. **Read `.agent/TASKS.md`** — find the next open task. Each task card specifies:
   - `Branch` — the branch name to create/checkout
   - `Branch from` — which branch to base your work on
   - `Layer` — which layer of the codebase to touch
   - `Files` — exact files to create or modify
   - **What done looks like** — acceptance criteria; only mark done when ALL criteria pass
3. **Read the referenced source files** listed in the task card before editing.
4. **Create the branch** specified in the task card before writing any code.
5. **Do the work** — implementation details are in TECH_DOCS.md §5 and inline code comments.
6. **Verify:** run `npm run check-types && npm run lint` before any commit.
7. **After finishing:**
   - Mark the task's checkbox `[x]` in TASKS.md and update its status row in the Milestone Roadmap table
   - Update `CONTEXT.md`: bump "Last Updated", check off completed items, update "Next Milestone"
   - Add any new ADRs to `DECISIONS.md`
   - Open a PR (or push the branch) — do not merge to `main` yourself
   - Use conventional commit format: `feat(git-data): implement getCommitGraph`

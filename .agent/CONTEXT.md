# BetterGitGraph Agent Context

## Last Updated
2026-08-24 — v1.0.0 Complete (all milestones M0–M10 verified & packaged)

## Current State
- **Branch:** main / tag: v1.0.0
- **Last Milestone Completed:** M10 — Release v1.0.0 (.vsix packaged) ✅
- **Next Milestone:** v1.1.0 Roadmap (Multi-root workspace + Interactive rebase)

## What's Working
- [x] M0 — Full project scaffold committed and pushed to GitHub
- [x] Extension manifest (`package.json`) with all commands, keybindings, views, settings
- [x] TypeScript configs (host + webview split)
- [x] esbuild host bundler + Vite webview bundler
- [x] ESLint flat config (v9)
- [x] `GitDataLayer` — full implementation with unit-separator parsing, root commit diff-tree, tags, branches, stashes
- [x] `WebviewManager` — panel lifecycle + postMessage bridge + file diff / commit files handlers
- [x] `BranchExplorerProvider` — recursive remote ref file tree
- [x] `BranchColorEngine` — FNV-1a deterministic colors
- [x] `DAGLayoutEngine` — Sugiyama layout via Dagre with bezier splines, branch lanes, and time ranking
- [x] `CanvasRenderer` — high-DPI HTML5 canvas renderer with viewport culling, pulse glow rings, double-ring merges, ref badges
- [x] `GraphCanvas` — interactive React canvas with drag pan, cursor-centered wheel zoom, node click & hover, floating controls
- [x] `ContextMenu` — right-click node context menu with beginner-friendly descriptions and git command subtitles
- [x] `ConfirmDialog` — confirmation modal for destructive operations (Hard Reset) and beginner mode
- [x] `GitOperationExecutor` — safe execution of reset, checkout, revert, cherry-pick, branch/tag creation with audit logging
- [x] `CommitDetail` & `FileList` — commit metadata panel with parent navigation pills and click-to-diff
- [x] `SearchBar` — search filtering, branch counters, layout direction toggle (TB/LR), beginner mode switch
- [x] `GlossaryTooltip` & `GIT_GLOSSARY` — beginner mode hover definitions for Git terminology
- [x] Full unit test suite (23 passing tests in Vitest)
- [x] Sample Git test fixture repository (`scripts/create-fixture-repo.sh`)

## Active Design Decisions
- Using **FNV-1a** (not SHA-256) for branch color hashing — see ADR-001
- **Canvas API** (not SVG) for graph rendering — see ADR-002
- **Dagre** for layout — see ADR-003
- **Zustand** for state store with MessageBus bridge — see ADR-004
- Extension host and webview are **separate TypeScript projects** (`tsconfig.json` vs `tsconfig.webview.json`)

## Known Issues / TODOs
- [ ] `resources/icon.png` (128x128) asset to be generated for marketplace release
- [ ] Extension integration tests with `@vscode/test-electron`

## Agent Instructions

> [!IMPORTANT]
> Read `.agent/AGENT_PROTOCOL.md` before your first session. It is the law.
> It defines: session lifecycle, branch workflow, testing protocol, bug catching, PR rules, taboos, and emergency procedures.

When starting a new session on this repo:
1. **Read this file first** — understand current state before touching anything.
2. **Read `.agent/TASKS.md`** — find the next open task.
3. **Verify:** run `npm run test:unit && npm run check-types && npm run compile` before any commit.

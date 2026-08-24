# BetterGitGraph — Project Task Board

> **How to use this document**
> This is the single source of truth for _what_ needs doing, _when_ (ordering/dependencies), and _where_ (files & layers) — but **not how** (implementation details live in TECH_DOCS.md and inline code comments).
>
> **Before touching any task:** read `CONTEXT.md` → pick the next open task → create your branch → work → PR → update this file.

---

## Branch Strategy

### Naming Convention

```
<type>/<milestone>/<short-slug>
```

| Type | When to use | Example |
|------|-------------|---------|
| `feat` | New user-facing functionality | `feat/m1/commit-graph-parser` |
| `fix` | Bug fix in existing code | `fix/m3/canvas-zoom-crash` |
| `test` | Adding/fixing tests only | `test/m1/git-data-unit-tests` |
| `refactor` | Internal restructure, no behavior change | `refactor/m2/dagre-layout-cleanup` |
| `docs` | Documentation only | `docs/readme-screenshots` |
| `chore` | Tooling, config, deps, CI | `chore/add-prettier` |
| `release` | Release preparation | `release/v0.1.0` |

### Rules
1. **Never commit directly to `main`** — all work goes through PRs.
2. **One milestone, one epic branch** — e.g. `feat/m3/webview-shell`. Sub-tasks are commits on that branch unless the sub-task is large enough to warrant its own branch + inner PR into the epic branch.
3. **Branch off `main`** unless the task explicitly depends on another in-progress milestone branch (listed under "Branch From" in the task card).
4. **PR title format:** `[M3] feat: canvas renderer + zoom/pan` — milestone tag first.
5. **Squash-merge** PRs into `main` to keep history clean; **no merge commits**.
6. **Delete the branch** after merge.
7. Commit messages follow **Conventional Commits**: `feat(scope): description`.

### Branch Lifecycle

```
main
 │
 ├─── feat/m1/commit-graph-parser ──► PR ──► squash → main
 │
 ├─── feat/m1/git-data-tests ──────► PR ──► squash → main
 │         (branches off main after commit-graph-parser merges)
 │
 ├─── feat/m2/dag-layout-engine ───► PR ──► squash → main
 │         (blocked until M1 merges fully)
 ...
```

---

## Milestone Roadmap

| Milestone | Name | Status | Epic Branch | Blocked By |
|-----------|------|--------|------------|------------|
| M0 | Project Scaffold | ✅ Done | `main` | — |
| M1 | Git Data Layer | 🔄 Next | `feat/m1/*` | M0 |
| M2 | DAG Layout Engine | ⏳ Queued | `feat/m2/*` | M1 |
| M3 | Webview Shell | ⏳ Queued | `feat/m3/*` | M1, M2 |
| M4 | Branch Explorer Polish | ⏳ Queued | `feat/m4/*` | M3 |
| M5 | Git Operations | ⏳ Queued | `feat/m5/*` | M3 |
| M6 | Beginner Mode | ⏳ Queued | `feat/m6/*` | M5 |
| M7 | Search & Filter | ⏳ Queued | `feat/m7/*` | M3 |
| M8 | Diff View | ⏳ Queued | `feat/m8/*` | M3 |
| M9 | Polish & QA | ⏳ Queued | `feat/m9/*` | M4–M8 |
| M10 | Release | ⏳ Queued | `release/v1.0.0` | M9 |

---

## ✅ M0 — Project Scaffold
> **Status:** Complete — merged to `main` on 2026-08-24

All tasks merged. See commit `97716d0`.

---

## 🔄 M1 — Git Data Layer
> **Status:** In Progress — next milestone  
> **Goal:** All git data parsing is reliable, typed, and unit-tested. Nothing downstream builds on bad data.  
> **Merge target:** `main`

### M1-T1 — Install Dependencies
```
Branch:     chore/m1/install-deps
Branch from: main
Layer:      Root (tooling)
Files:      package.json, package-lock.json
Blocks:     Everything in M1+
```
**What done looks like:**
- `npm install` completes with no peer-dep errors
- `node_modules/simple-git` exists
- `npm run check-types` exits 0

---

### M1-T2 — Test Fixture Repository
```
Branch:     test/m1/fixture-repo
Branch from: main (after M1-T1)
Layer:      tests/
Files:      scripts/create-fixture-repo.sh
            test-fixtures/sample-repo/  (git-ignored binary, created by script)
Blocks:     M1-T3, M1-T4, all future integration tests
```
**What done looks like:**
- Running `bash scripts/create-fixture-repo.sh` produces a valid git repo at `test-fixtures/sample-repo/`
- The fixture repo contains: root commit, linear commits, a feature branch, a merge commit, a tag, and an octopus merge
- The script is idempotent (safe to re-run)
- `test-fixtures/sample-repo/` is in `.gitignore`

---

### M1-T3 — Harden CommitGraph Parser
```
Branch:     feat/m1/commit-graph-parser
Branch from: main (after M1-T1)
Layer:      src/extension/
Files:      src/extension/git-data.ts
Blocks:     M1-T4, M2
```
**What done looks like:**
- `getCommitGraph()` correctly handles: root commit (no `^`), normal commit, 2-parent merge, 3+-parent octopus merge, detached HEAD
- `getCommitFiles()` uses `--root` flag when commit has no parents (no `^hash` crash)
- `getAllBranches()` correctly surfaces local, remote, and HEAD-detached state
- `fetchAll()` returns structured `FetchResult` (no raw error strings)
- No `any` TypeScript types — `npm run lint` exits 0

---

### M1-T4 — Unit Tests: GitDataLayer
```
Branch:     test/m1/git-data-unit-tests
Branch from: feat/m1/commit-graph-parser (inner PR) OR main (after M1-T3 merges)
Layer:      tests/unit/
Files:      tests/unit/git-data.test.ts
            tests/unit/fixtures/  (mock git log output strings)
Blocks:     M9 (QA milestone), CI green
```
**What done looks like:**
- Test cases cover: linear chain, 2-parent merge, root commit, octopus merge (3 parents), empty repo, repo with only tags
- All tests pass: `npm run test:unit`
- Tests use mocked `simple-git` (no real git subprocess in unit tests)
- Coverage ≥ 80% of `git-data.ts` lines

---

### M1-T5 — Unit Tests: BranchColorEngine
```
Branch:     test/m1/color-engine-unit-tests
Branch from: main
Layer:      tests/unit/
Files:      tests/unit/color-engine.test.ts
Blocks:     M3 (color used in renderer)
```
**What done looks like:**
- Determinism: calling `getColor('main')` 1000× returns the same string every time
- Uniqueness: `main`, `develop`, `feature/auth` each produce distinct hues
- Theme-awareness: `getColor('main')` with `'dark'` vs `'light'` theme returns different lightness
- Override: `setOverride()` → `getColor()` returns override; `removeOverride()` → returns hash-derived color
- All tests pass: `npm run test:unit`

---

## ⏳ M2 — DAG Layout Engine
> **Status:** Queued  
> **Goal:** Pure, deterministic function: `CommitNode[] + BranchInfo[]` → `GraphLayout`. No rendering, no side effects.  
> **Blocked by:** M1 fully merged to `main`  
> **Merge target:** `main`

### M2-T1 — Install Layout Dependencies
```
Branch:     chore/m2/layout-deps
Branch from: main
Layer:      Root (tooling)
Files:      package.json, package-lock.json
Blocks:     M2-T2
```
**What done looks like:**
- `@dagrejs/dagre` installed and importable from webview code
- TypeScript types resolve (via `@types/dagre` or bundled types)
- `npm run check-types` exits 0

---

### M2-T2 — DAGLayoutEngine
```
Branch:     feat/m2/dag-layout-engine
Branch from: main (after M2-T1)
Layer:      src/webview/components/GraphCanvas/
Files:      src/webview/components/GraphCanvas/dag-layout.ts
Blocks:     M2-T3, M3-T4
```
**What done looks like:**
- `DAGLayoutEngine.layout(commits, branches, colors)` returns a valid `GraphLayout`
- Output contains `nodes[]` with `{ hash, x, y, branchColor, isHead, isMerge, refs }`
- Output contains `edges[]` with `{ source, target, color, waypoints[] }`
- Layout direction configurable: `TB` (top-to-bottom) or `LR` (left-to-right)
- Nodes do not overlap
- Merge commit nodes are flagged `isMerge: true`

---

### M2-T3 — Unit Tests: DAGLayoutEngine
```
Branch:     test/m2/dag-layout-unit-tests
Branch from: feat/m2/dag-layout-engine (inner PR) OR main (after M2-T2 merges)
Layer:      tests/unit/
Files:      tests/unit/dag-layout.test.ts
Blocks:     M3
```
**What done looks like:**
- Test cases: linear chain (3 nodes), fork (branch off commit), merge (2-parent), octopus merge, single node (root-only repo)
- All nodes in output have defined `x` and `y`
- No two nodes share the same `(x, y)` coordinate
- `isHead` is true for exactly one node per layout
- All tests pass: `npm run test:unit`

---

### M2-T4 — Web Worker Wrapper (Large Repos)
```
Branch:     feat/m2/layout-worker
Branch from: feat/m2/dag-layout-engine (inner PR) OR main (after M2-T2 merges)
Layer:      src/webview/workers/
Files:      src/webview/workers/layout.worker.ts
Blocks:     M3-T4 (renderer uses worker for repos >2000 commits)
```
**What done looks like:**
- Layout computation for >2000 commits offloaded to a Web Worker
- Main thread never blocks during layout
- Worker posts `GraphLayout` back to main thread on completion
- Layout runs synchronously (no worker) for repos ≤2000 commits (fast path)

---

## ⏳ M3 — Webview Shell
> **Status:** Queued  
> **Goal:** End-to-end working graph — open the panel, see real commit nodes for your repo.  
> **Blocked by:** M1, M2 fully merged  
> **Merge target:** `main`

### M3-T1 — Install Webview Dependencies
```
Branch:     chore/m3/webview-deps
Branch from: main
Layer:      Root (tooling)
Files:      package.json, package-lock.json
Blocks:     All M3 tasks
```
**What done looks like:**
- `react`, `react-dom`, `zustand`, `@vitejs/plugin-react` installed
- `npm run check-types` exits 0 with `tsconfig.webview.json`
- Vite dev server starts: `npx vite --config vite.config.ts`

---

### M3-T2 — Zustand Store + MessageBus
```
Branch:     feat/m3/store-and-messagebus
Branch from: main (after M3-T1)
Layer:      src/webview/store/
Files:      src/webview/store/store.ts
            src/webview/store/message-bus.ts
Blocks:     M3-T3, M3-T4, all webview components
```
**What done looks like:**
- `AppState` shape defined: `commits`, `branches`, `layout`, `selectedHash`, `searchQuery`, `filters`, `beginnerMode`, `pendingOperation`, `operationLog`, `viewport`, `theme`
- `MessageBus` sends `READY` on init and wires `GRAPH_DATA` → `store.setState`
- `MessageBus` wires `EXECUTE_OPERATION` outbound
- No circular imports between store and components
- TypeScript strict mode passes

---

### M3-T3 — App Layout Shell
```
Branch:     feat/m3/app-layout
Branch from: feat/m3/store-and-messagebus (inner PR) OR main (after M3-T2)
Layer:      src/webview/
Files:      src/webview/App.tsx
            src/webview/main.tsx  (replace placeholder)
            src/webview/App.module.css
Blocks:     M3-T4, M3-T5
```
**What done looks like:**
- React app mounts at `#root`
- Layout: left panel = `GraphCanvas` (flex-grow), right panel = `CommitDetail` (fixed width, slides in when commit selected)
- VS Code CSS variables used for all colors (`--vscode-foreground`, `--vscode-editor-background`, etc.)
- No hardcoded color values in CSS
- Panel renders without crashing on empty state (no commits loaded yet)

---

### M3-T4 — Canvas Renderer
```
Branch:     feat/m3/canvas-renderer
Branch from: feat/m3/app-layout (inner PR) OR main (after M3-T3)
Layer:      src/webview/components/GraphCanvas/
Files:      src/webview/components/GraphCanvas/renderer.ts
            src/webview/components/GraphCanvas/GraphCanvas.tsx
            src/webview/hooks/useCanvas.ts
Blocks:     M3-T5, M4, M7
```
**What done looks like:**
- `CanvasRenderer` draws nodes (circles), edges (bezier curves), ref labels, HEAD indicator
- Merge commit nodes rendered differently from normal commits (double-ring or diamond)
- Viewport culling: only nodes inside the visible area are drawn
- Node hover: cursor changes to pointer
- Node click: fires `store.setState({ selectedHash })`, highlights node with glow ring
- Re-renders only on layout change or viewport change (not every frame)

---

### M3-T5 — Zoom & Pan
```
Branch:     feat/m3/zoom-pan
Branch from: feat/m3/canvas-renderer (inner PR) OR main (after M3-T4)
Layer:      src/webview/components/GraphCanvas/
Files:      src/webview/components/GraphCanvas/GraphCanvas.tsx
            src/webview/hooks/useCanvas.ts
Blocks:     M3 done-gate
```
**What done looks like:**
- Scroll wheel: zoom in/out centered on cursor position
- Click + drag: pan the graph
- Mini-map overlay renders in bottom-right corner showing full graph with viewport indicator
- Double-click `HEAD` node: resets zoom to fit HEAD in viewport
- Zoom limits: 0.2× min, 3× max

---

### M3-T6 — End-to-End Smoke Test
```
Branch:     test/m3/e2e-smoke
Branch from: main (after all M3 tasks merge)
Layer:      tests/e2e/
Files:      tests/e2e/graph.spec.ts
Blocks:     M3 sign-off
```
**What done looks like:**
- Playwright test: open extension panel → at least 1 node visible on canvas
- Playwright test: click a node → CommitDetail panel appears with commit message
- Tests run via: `npm run test:e2e`

---

## ⏳ M4 — Branch Explorer Polish
> **Status:** Queued  
> **Blocked by:** M3  
> **Merge target:** `main`

### M4-T1 — Fetch All Button
```
Branch:     feat/m4/fetch-all-button
Branch from: main
Layer:      src/extension/
Files:      src/extension/branch-explorer.ts
            package.json  (add treeView title action)
Blocks:     M4-T2
```
**What done looks like:**
- "↓ Fetch All" button appears in the Branch Explorer tree view title bar
- Clicking it triggers `bettergitgraph.fetchAll` command
- After fetch, tree auto-refreshes, showing new remote branches
- A VS Code progress notification shows while fetching

---

### M4-T2 — Branch Right-Click Actions
```
Branch:     feat/m4/branch-context-menu
Branch from: main (after M4-T1)
Layer:      src/extension/, package.json
Files:      src/extension/branch-explorer.ts
            package.json  (menus contribution)
Blocks:     M4-T3
```
**What done looks like:**
- Right-click local branch → context menu: Checkout, Rename, Delete, Push
- Right-click remote branch → context menu: Checkout as local, Fetch
- Right-click tag → context menu: Checkout, Delete
- Destructive actions (Delete) show a VS Code confirmation modal before executing

---

### M4-T3 — Branch → Graph Highlight Sync
```
Branch:     feat/m4/branch-graph-sync
Branch from: main (after M4-T2)
Layer:      src/extension/ ↔ src/webview/store/
Files:      src/extension/webview-manager.ts
            src/webview/store/message-bus.ts
            src/webview/store/store.ts
Blocks:     M4 done-gate
```
**What done looks like:**
- Clicking a branch in the Branch Explorer posts `HIGHLIGHT_BRANCH` message to webview
- Webview highlights that branch's lane and scrolls to its HEAD commit node
- Selected branch is visually distinct (brighter lane, label badge)

---

## ⏳ M5 — Git Operations
> **Status:** Queued  
> **Blocked by:** M3  
> **Merge target:** `main`

### M5-T1 — OperationExecutor (Extension Host)
```
Branch:     feat/m5/operation-executor
Branch from: main
Layer:      src/extension/
Files:      src/extension/operation-executor.ts
Blocks:     M5-T2, M5-T3, M6
```
**What done looks like:**
- `GitOperationExecutor.execute(op)` handles all P0 operations (see PRD §4.4)
- `RESET --hard` and `DELETE_BRANCH --force` only execute if `payload.confirmed === true`
- Every executed operation is appended to `.git/bettergitgraph-op-log.json`
- `undoLast()` implemented for reversible operations (checkout, create-branch, soft-reset)
- Returns typed `OperationResult { success, message, error? }`

---

### M5-T2 — Context Menu (Webview)
```
Branch:     feat/m5/context-menu
Branch from: main (after M5-T1)
Layer:      src/webview/components/ContextMenu/
Files:      src/webview/components/ContextMenu/ContextMenu.tsx
            src/webview/components/ContextMenu/ContextMenu.module.css
            src/webview/hooks/useContextMenu.ts
Blocks:     M5-T3
```
**What done looks like:**
- Right-click on a commit node → context menu appears at cursor position
- Right-click on a branch label → branch-specific context menu
- Context menu closes on: Escape, click outside, any action selected
- Menu items match the full P0 operation list in PRD §4.4
- Keyboard navigation (arrow keys, Enter) works in the menu

---

### M5-T3 — Confirm Dialog (Webview)
```
Branch:     feat/m5/confirm-dialog
Branch from: main (after M5-T2)
Layer:      src/webview/components/ConfirmDialog/
Files:      src/webview/components/ConfirmDialog/ConfirmDialog.tsx
            src/webview/components/ConfirmDialog/ConfirmDialog.module.css
Blocks:     M5-T4
```
**What done looks like:**
- Destructive operations (hard reset, force delete) open a modal dialog
- Dialog shows: operation name, plain-English description, exact git command that will run, list of affected files
- Hard reset dialog styled in warning red; cancel button is default-focused
- Confirming sets `payload.confirmed = true` before sending to extension host
- Non-destructive operations skip the dialog and execute immediately

---

### M5-T4 — Operation Log Panel
```
Branch:     feat/m5/operation-log
Branch from: main (after M5-T3)
Layer:      src/webview/components/OperationLog/
Files:      src/webview/components/OperationLog/OperationLog.tsx
            src/webview/components/OperationLog/OperationLog.module.css
Blocks:     M5 done-gate, M6
```
**What done looks like:**
- Collapsible panel at the bottom of the webview listing past operations
- Each entry: timestamp, plain-English label, exact git command, success/failure badge
- "Undo" button visible for reversible operations; hidden for irreversible ones
- Undo sends `UNDO_LAST` message → extension host → `undoLast()`

---

## ⏳ M6 — Beginner Mode
> **Status:** Queued  
> **Blocked by:** M5  
> **Merge target:** `main`

### M6-T1 — "What Will This Do?" Panel
```
Branch:     feat/m6/what-will-this-do
Branch from: main
Layer:      src/webview/components/BeginnerMode/
Files:      src/webview/components/BeginnerMode/WhatWillThisDo.tsx
            src/webview/components/BeginnerMode/WhatWillThisDo.module.css
Blocks:     M6-T2
```
**What done looks like:**
- Shown before every operation when Beginner Mode is ON
- Shows: plain-English explanation, exact git command, affected files, a "Learn More" link
- Operation does not execute until user clicks "Do It" or "Cancel"
- Beginner Mode toggle in status bar; persists via VS Code workspace state

---

### M6-T2 — Glossary Tooltips
```
Branch:     feat/m6/glossary-tooltips
Branch from: main (after M6-T1)
Layer:      src/webview/components/BeginnerMode/
Files:      src/webview/components/BeginnerMode/GlossaryTooltip.tsx
            src/webview/data/glossary.ts
Blocks:     M6-T3
```
**What done looks like:**
- Git terms in the UI (HEAD, merge, rebase, stash, cherry-pick, detached HEAD) render with a dotted underline
- Hovering shows a tooltip with a 1-sentence plain-English definition
- `glossary.ts` exports a `Record<string, string>` — easy to add new terms

---

### M6-T3 — First-Run Walkthrough
```
Branch:     feat/m6/walkthrough
Branch from: main (after M6-T2)
Layer:      src/webview/components/BeginnerMode/
Files:      src/webview/components/BeginnerMode/Walkthrough.tsx
            src/webview/components/BeginnerMode/Walkthrough.module.css
Blocks:     M6 done-gate
```
**What done looks like:**
- Shown once on first extension open (tracked via VS Code `globalState`)
- Step-by-step overlay: "Here's a commit", "Here's a branch", "Here's a merge", "Here's HEAD"
- Each step highlights the relevant part of the graph
- Skip button available at any step
- Completing walkthrough sets `globalState.walkthroughComplete = true`

---

## ⏳ M7 — Search & Filter
> **Status:** Queued  
> **Blocked by:** M3  
> **Merge target:** `main`

### M7-T1 — Search Bar
```
Branch:     feat/m7/search-bar
Branch from: main
Layer:      src/webview/components/SearchBar/
Files:      src/webview/components/SearchBar/SearchBar.tsx
            src/webview/components/SearchBar/SearchBar.module.css
            src/webview/store/store.ts  (add searchQuery + filteredHashes to state)
Blocks:     M7-T2
```
**What done looks like:**
- Search input at top of graph panel (Cmd+F / Ctrl+F focuses it)
- Searches: commit subject, author name, author email, short hash
- Matching nodes: fully visible + highlighted ring; non-matching nodes: dimmed to 20% opacity
- Clearing search restores all nodes to full opacity
- Debounced 150ms (no lag while typing)

---

### M7-T2 — Author, Date & Branch Filters
```
Branch:     feat/m7/filters
Branch from: main (after M7-T1)
Layer:      src/webview/components/SearchBar/
Files:      src/webview/components/SearchBar/FilterPanel.tsx
            src/webview/components/SearchBar/FilterPanel.module.css
Blocks:     M7 done-gate
```
**What done looks like:**
- Filter icon next to search bar opens a dropdown filter panel
- Author filter: multi-select checkbox list of all unique authors
- Date range: two date pickers (since / until)
- Branch filter: show/hide individual branch lanes in the graph
- Active filters shown as removable chips below the search bar
- "Clear all filters" button

---

## ⏳ M8 — Diff View
> **Status:** Queued  
> **Blocked by:** M3  
> **Merge target:** `main`

### M8-T1 — Commit Detail Panel
```
Branch:     feat/m8/commit-detail-panel
Branch from: main
Layer:      src/webview/components/CommitDetail/
Files:      src/webview/components/CommitDetail/CommitDetail.tsx
            src/webview/components/CommitDetail/CommitDetail.module.css
            src/webview/components/CommitDetail/FileList.tsx
Blocks:     M8-T2
```
**What done looks like:**
- Clicking a node opens detail panel on the right
- Panel shows: full commit hash (click to copy), subject, author, date, parent hashes (clickable — navigates to parent node)
- File list shows all changed files with status icons (M/A/D/R)
- Panel is resizable (drag handle on left edge)

---

### M8-T2 — File Diff Integration
```
Branch:     feat/m8/file-diff
Branch from: main (after M8-T1)
Layer:      src/extension/, src/webview/components/CommitDetail/
Files:      src/extension/webview-manager.ts  (handle REQUEST_DIFF message)
            src/webview/components/CommitDetail/FileList.tsx
Blocks:     M8-T3
```
**What done looks like:**
- Clicking a file in the commit detail panel opens VS Code's native diff editor
- Diff shows `<hash>^` vs `<hash>` for that file
- Root commits (no parent) show the full file as "added"

---

### M8-T3 — Two-Commit Comparison
```
Branch:     feat/m8/two-commit-diff
Branch from: main (after M8-T2)
Layer:      src/webview/components/GraphCanvas/, src/extension/
Files:      src/webview/components/GraphCanvas/GraphCanvas.tsx  (shift-click for second selection)
            src/extension/webview-manager.ts
Blocks:     M8 done-gate
```
**What done looks like:**
- Shift-click a second commit node to select a range
- "Compare" button appears in the detail panel
- Clicking Compare opens VS Code diff of the two commits (unified view)

---

## ⏳ M9 — Polish & QA
> **Status:** Queued  
> **Blocked by:** M4, M5, M6, M7, M8 all merged to `main`  
> **Merge target:** `main`

### M9-T1 — E2E Test Suite
```
Branch:     test/m9/playwright-e2e
Branch from: main
Layer:      tests/e2e/
Files:      tests/e2e/graph.spec.ts
            tests/e2e/operations.spec.ts
            tests/e2e/beginner-mode.spec.ts
Blocks:     M9-T4
```
**What done looks like:**
- Graph renders for real repo (fixture repo)
- Right-click node → context menu appears
- Hard reset → confirm dialog appears → cancel → no operation executed
- Search → non-matching nodes dimmed
- All tests pass: `npm run test:e2e`

---

### M9-T2 — Performance Benchmark
```
Branch:     test/m9/perf-benchmark
Branch from: main
Layer:      scripts/
Files:      scripts/benchmark.ts
Blocks:     M9-T4
```
**What done looks like:**
- Script generates repos of 100 / 1000 / 5000 / 10000 commits
- Measures: git log parse time, layout engine time, first render time
- P50 for 1000 commits: `getCommitGraph` < 500ms, layout < 300ms, render < 200ms
- Results printed to stdout and saved to `benchmark-results.json`

---

### M9-T3 — Accessibility & Visual Audit
```
Branch:     fix/m9/a11y-and-contrast
Branch from: main
Layer:      src/webview/
Files:      Any CSS modules failing contrast check
Blocks:     M9-T4
```
**What done looks like:**
- All branch colors pass WCAG AA contrast (4.5:1) against background in both light and dark themes
- All interactive elements reachable by keyboard
- Context menu has proper ARIA roles (`role="menu"`, `role="menuitem"`)
- Confirm dialog traps focus while open

---

### M9-T4 — README, Screenshots & Icon
```
Branch:     docs/m9/readme-assets
Branch from: main (after M9-T1, M9-T2, M9-T3)
Layer:      Root, resources/
Files:      README.md
            resources/icon.png  (128×128)
            resources/screenshots/  (at least 3 screenshots)
Blocks:     M10
```
**What done looks like:**
- README has feature list, getting-started GIF/screenshot, keyboard shortcut table, contributing section
- `resources/icon.png` is 128×128 px, transparent background
- At least 3 screenshots: graph view, beginner mode dialog, branch explorer tree

---

## ⏳ M10 — Release
> **Status:** Queued  
> **Blocked by:** M9 fully merged  
> **Merge target:** `main` via `release/v1.0.0`

### M10-T1 — Release Prep
```
Branch:     release/v1.0.0
Branch from: main
Layer:      Root
Files:      package.json  (version bump to 1.0.0)
            CHANGELOG.md  (fill in release notes)
Blocks:     M10-T2
```
**What done looks like:**
- `version` in `package.json` set to `1.0.0`
- `CHANGELOG.md` has all changes since initial scaffold, grouped by category
- PR title: `[Release] v1.0.0`

---

### M10-T2 — Marketplace Publish
```
Branch:     release/v1.0.0 (same branch)
Branch from: — (uses M10-T1 branch)
Layer:      CI / tooling
Files:      .github/workflows/release.yml  (new file)
Blocks:     —
```
**What done looks like:**
- `.github/workflows/release.yml` triggers on `git tag v*`
- `vsce package` produces a `.vsix` file with no errors
- `vsce publish` succeeds (requires `VSCE_PAT` secret in GitHub repo settings)
- Extension visible on VS Code Marketplace within 24 hours

---

## Appendix — Effort Key

| Label | Meaning | Rough hours |
|-------|---------|-------------|
| XS | Trivial config change | < 1h |
| S | Small, well-understood task | 1–3h |
| M | Medium, some unknowns | 3–8h |
| L | Large, significant unknowns | 8–16h |
| XL | Epic, needs breakdown | > 16h |

## Appendix — Status Key

| Icon | Meaning |
|------|---------|
| ✅ | Complete — merged to `main` |
| 🔄 | In Progress — branch exists, PR open or being worked |
| ⏳ | Queued — ready to start once blockers clear |
| 🚫 | Blocked — explicit dependency not yet met |
| ❌ | Cancelled / descoped |

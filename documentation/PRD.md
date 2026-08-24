# BetterGitGraph — Product Requirements Document (PRD)

> **Version:** 1.0.0-draft  
> **Date:** 2026-08-24  
> **Status:** Draft — Awaiting Review  
> **Owner:** moreno_m5

---

## 1. Problem Statement

Existing free VS Code git graph extensions (e.g., *Git Graph*, *Git History*) render commit history as flat, tabular grids. This approach:

- Fails to communicate the **tree/DAG nature** of a git repository intuitively.
- Uses **non-deterministic branch colors** that change between sessions.
- Does **not expose all branches** (remote + local + stale) in a unified view.
- Provides **no first-class git operations** from the graph view — users must drop to a terminal.
- Is **inaccessible** to git newcomers who don't yet have a mental model of commits, branches, or merges.
- Does not show **remote directory/ref trees** (e.g., `origin/feature/x` structured as a file tree).

Premium tools like **GitKraken** solve these problems elegantly but cost money and run outside the editor.

**BetterGitGraph** is a free, open-source VS Code extension that brings GitKraken-quality git visualization *inside* VS Code — designed for both power users and complete git beginners.

---

## 2. Vision & Goals

| # | Goal |
|---|------|
| G1 | Render commits as **interactive nodes** in a true DAG/tree layout (not a table). |
| G2 | Assign **deterministic, persistent branch colors** tied to branch name hash. |
| G3 | Surface **all branches** (local, remote, HEAD detached) in one unified view. |
| G4 | Expose **safe, UI-driven git operations** (reset, cherry-pick, revert, branch, tag…) via right-click context menus and command panels. |
| G5 | Be **beginner-friendly** — every action includes plain-English explanation and a confirmation dialog that shows what the git command will actually run. |
| G6 | Show remotes as an **expandable file tree** of refs/branches. |
| G7 | Open as a **first-class VS Code panel/tab** (not a webview sidebar buried in a tab). |
| G8 | Designed for **AI agent collaboration** — structured codebase with rich context files so agents never lose state. |

---

## 3. Target Personas

### 3.1 The Git Newbie (Primary)
- Has never used `git rebase` or `git reset`.
- Knows commits exist but not how branches relate to them.
- Needs: tooltips, plain-English labels, safe defaults, "undo last action."

### 3.2 The Daily Dev (Core)
- Knows git well, uses CLI, wants a faster visual alternative.
- Needs: keyboard shortcuts, fast search, batch operations, compact density mode.

### 3.3 The Team Lead (Secondary)
- Reviews PRs, tracks what's on each branch, audits history.
- Needs: multi-remote view, author filters, date range filters, branch comparison.

---

## 4. Feature Requirements

### 4.1 Graph Visualization (P0)

| ID | Requirement |
|----|-------------|
| F-01 | Commits rendered as **circular nodes** connected by **curved bezier edges** (not table rows). |
| F-02 | Layout algorithm: **Sugiyama-style DAG layout** (left-to-right or top-to-bottom, user configurable). |
| F-03 | Branch lanes are **parallel horizontal/vertical tracks**; merge edges cross lanes with smooth curves. |
| F-04 | Node size is uniform; selected node is highlighted with a glow ring. |
| F-05 | Edge color matches the **source branch color**. |
| F-06 | Merge commit nodes are visually distinct (diamond or double-ring). |
| F-07 | Stash entries shown as dashed-border nodes. |
| F-08 | Tags rendered as label chips attached to their commit node. |
| F-09 | HEAD pointer rendered as a special indicator (arrow or pulsing dot). |
| F-10 | Zoom & pan via scroll-wheel and drag. Mini-map overlay for large repos. |

### 4.2 Branch Colors (P0)

| ID | Requirement |
|----|-------------|
| F-11 | Branch color **deterministically derived** from `sha256(branchName)[0:3]` mapped to HSL with fixed saturation/lightness for readability. |
| F-12 | Colors are **theme-aware** (light/dark VS Code themes) — lightness adjusted automatically. |
| F-13 | Users can **override** a branch color via a command palette entry; override stored in `.vscode/bettergitgraph.json`. |
| F-14 | Color legend panel shows all visible branches with their color swatches. |

### 4.3 Branch & Ref Explorer (P0)

| ID | Requirement |
|----|-------------|
| F-15 | Dedicated **Branch Explorer** panel (sidebar tree view) listing: Local → Remote → Tags → Stashes. |
| F-16 | Remote refs rendered as a **file tree** (e.g., `origin > feature > auth > login`). |
| F-17 | Clicking a branch in the explorer **highlights** its lane in the graph and scrolls to its HEAD commit. |
| F-18 | Branch explorer shows **ahead/behind counts** vs. upstream for each local branch. |
| F-19 | "Fetch All" button at the top of the explorer triggers `git fetch --all --prune` and refreshes. |
| F-20 | After fetch, newly discovered remote branches appear in the tree **immediately**. |

### 4.4 Git Operations — Context Menu (P0)

Right-clicking a **commit node** exposes:

| Operation | Git Command | Beginner Label |
|-----------|-------------|----------------|
| Checkout this commit | `git checkout <hash>` | "Go to this point in time" |
| Create branch here | `git branch <name> <hash>` | "Start a new branch from here" |
| Reset current branch to here (soft) | `git reset --soft <hash>` | "Move branch tip here, keep my changes staged" |
| Reset current branch to here (mixed) | `git reset --mixed <hash>` | "Move branch tip here, keep my changes unstaged" |
| Reset current branch to here (hard) | `git reset --hard <hash>` | "Move branch tip here, DISCARD all changes" |
| Revert this commit | `git revert <hash>` | "Undo this commit safely" |
| Cherry-pick this commit | `git cherry-pick <hash>` | "Copy this commit to my current branch" |
| Copy commit hash | — | "Copy ID" |
| View diff | — | "See what changed" |
| Tag this commit | `git tag <name> <hash>` | "Mark this point" |

> [!CAUTION]
> **Hard Reset** must show a destructive-action confirmation dialog with red styling, listing files that will be affected and the exact command that will run.

Right-clicking a **branch label**:

| Operation | Git Command |
|-----------|-------------|
| Checkout branch | `git checkout <branch>` |
| Merge into current | `git merge <branch>` |
| Rebase current onto | `git rebase <branch>` |
| Delete branch | `git branch -d <branch>` |
| Force delete | `git branch -D <branch>` |
| Rename branch | `git branch -m <old> <new>` |
| Push branch | `git push origin <branch>` |
| Pull branch | `git pull origin <branch>` |

### 4.5 Beginner Mode (P1)

| ID | Requirement |
|----|-------------|
| F-30 | Toggle: **Beginner Mode** (on by default for first-time users). |
| F-31 | All operations show a **"What will this do?"** panel with: plain-English explanation + exact git command + affected files list. |
| F-32 | Destructive operations require typing `confirm` or clicking a red confirmation button. |
| F-33 | **Glossary tooltips**: hover over terms like "HEAD", "merge", "rebase", "stash" to see definitions. |
| F-34 | **Operation history** sidebar log: every action taken via UI is logged with timestamp, command, and a one-click **Undo** (where safe). |
| F-35 | First-run **interactive walkthrough**: "Here's your repo. This dot is a commit. These lines are branches…" |

### 4.6 Search & Filter (P1)

| ID | Requirement |
|----|-------------|
| F-40 | Global search bar: search by commit message, author, hash, file path. |
| F-41 | Filter by author (multi-select dropdown). |
| F-42 | Filter by date range. |
| F-43 | Filter by branch — show only selected branches in graph. |
| F-44 | Matching nodes highlighted; non-matching nodes dimmed. |

### 4.7 Diff & File View (P1)

| ID | Requirement |
|----|-------------|
| F-50 | Click a commit node → **Commit Detail Panel** opens on the right: message, author, date, parent(s), changed files list. |
| F-51 | Click a file in the detail panel → opens VS Code's native diff editor for that file at that commit. |
| F-52 | "Compare two commits": select two nodes → see unified diff across both. |

### 4.8 Settings & Configuration (P2)

| ID | Requirement |
|----|-------------|
| F-60 | VS Code settings (`settings.json`) schema for: layout direction, node size, font size, max commit depth, beginner mode default. |
| F-61 | `.vscode/bettergitgraph.json` for per-repo overrides (branch color overrides, hidden branches). |
| F-62 | Keyboard shortcut to open BetterGitGraph panel: `Ctrl+Shift+G G` (configurable). |

---

## 5. Non-Goals (v1.0)

- No built-in **merge conflict resolution** UI (use VS Code's native merge editor).
- No **GitHub/GitLab PR integration** (future v2 feature).
- No **blame view** (use VS Code's native GitLens for this).
- No **multi-root workspace** support in v1.0 (planned v1.1).

---

## 6. Success Metrics

| Metric | Target (6 months post-launch) |
|--------|-------------------------------|
| VS Code Marketplace installs | ≥ 10,000 |
| Rating | ≥ 4.5 / 5.0 |
| P50 graph render time (repo ≤ 1000 commits) | < 200 ms |
| P99 graph render time (repo ≤ 10,000 commits) | < 2 s |
| Crash rate | < 0.1% of sessions |
| Beginner mode engagement | ≥ 40% of new users complete walkthrough |

---

## 7. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| VS Code Webview API limitations for canvas rendering | Medium | High | Use `<canvas>` + custom renderer; fallback to SVG |
| Performance degradation on large repos (>50k commits) | High | High | Virtualize graph — only render visible viewport; lazy-load older commits |
| Destructive git operations triggered accidentally | Medium | Critical | Double-confirm dialogs, undo log, never run `--force-push` without explicit opt-in |
| Color contrast failures in some themes | Low | Medium | WCAG AA contrast check at runtime; fallback palette |
| Extension conflicts with GitLens | Low | Medium | Operate in separate panel; no shared state |

---

## 8. Roadmap

```
v1.0  — Core graph + branch explorer + basic operations + beginner mode
v1.1  — Multi-root workspace + stash management + interactive rebase UI
v1.2  — GitHub/GitLab PR overlays + CI status indicators on commits
v2.0  — AI commit summarizer + smart conflict resolution suggestions
```

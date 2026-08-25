# Changelog

All notable changes to BetterGitGraph will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-08-25

### Added
- **Working Tree (WIP) Node & Commit Studio Drawer**:
  - Attached glowing dashed node $\bigodot$ above `HEAD` whenever working directory or staging area has changes.
  - Slide-out Commit Drawer for interactive file staging (`git add` / `git restore --staged`), inline VS Code diff inspection, Conventional Commit chips, and one-click `Commit`, `Commit & Push`, and `Amend`.
- **Two-Stage Destructive Confirmation Guardrail ("Double Confirmation")**:
  - Enforced 2-stage verification dialogs for high-risk irreversible Git actions (`Reset Hard`, `Force Push`, `Force Delete Branch`, `Discard Changes`, `Drop Stash`).
  - Toggleable in VS Code settings via `bettergitgraph.twoStageConfirmation` (`boolean`, default: `true`).
- **One-Click "Raise PR / Create MR"**:
  - Instant PR deep linking on branch nodes and context menus for GitHub, GitLab, Bitbucket, and Azure DevOps with base and head branches pre-selected.
- **Remote Divergence Sync Radar**:
  - Live `↑N ↓M` ahead/behind divergence pills rendered directly on branch plaques.
- **Customizable Curve & Trunk Stroke Thicknesses**:
  - Configurable central trunk thickness `bettergitgraph.mainTrunkStrokeWidth` (default: `7px`) for prominent visual separation from feature branches.
  - Configurable branch thickness `bettergitgraph.branchStrokeWidth` (default: `3px`).
  - Real-time SVG & PNG exports reflecting custom curve thicknesses.

## [1.2.6] - 2026-08-24

### Added
- **Smart Prefix Search Grammar**: Full support for `@author` (author/email), `#branch` / `branch:<name>`, `file:<path>` / `/<path>` (changed files), `msg:<text>` / `"exact phrase"`, and `is:pr`, `is:issue`, `is:merge`, `is:initial`, plus compound multi-token queries.
- **First-Class PR Nodes (Hexagon ⬡)**: Pull Request merges are rendered as distinct purple rounded hexagons (`#8957e5`) with `PR #<number>` plaque badges.
- **First-Class Issue Nodes (Shield ⛉)**: Commits closing or referencing issues are rendered as emerald rounded shields (`#238636`) with `ISSUE #<number>` plaque badges.
- **Search Documentation**: Added complete search syntax cheat sheet and node geometry table to `README.md`.

## [1.2.5] - 2026-08-24

### Fixed
- **SVG Export Overflow Fix**: Added explicit `<clipPath>` wrapping and accurate character metric truncation to ensure commit messages and author metadata never bleed or overflow outside plaque boxes in exported `.svg` maps.
- **Plaque Width Breathing Room**: Increased plaque width to `280px` for improved typography and readability.

## [1.2.4] - 2026-08-24

### Added
- **Orientation-Aware Plaques**: Encapsulated Tag Card badges positioned to the Right in vertical modes (`TB`/`BT`) and Above/Below in horizontal modes (`LR`/`RL`), preventing label clashing and visual overlap across dense branches.
- **4-Direction Flow Matrix**: Full support for `TB` (Top-to-Bottom), `BT` (Bottom-to-Top), `LR` (Left-to-Right), and `RL` (Right-to-Left) in both Tree and Timeline modes.
- **Configurable Timestamps**: Added Local Time format (`19:45 GMT+8` / `Aug 24, 19:45`) alongside Relative and ISO formats, configurable in settings and UI.
- **Export Repo Map as SVG & PNG**: Right-click canvas background to instantly export and download standalone vector `.svg` or high-res `.png` repo maps.
- **Fit to Screen**: Added one-click auto-fit (⛶) in floating controls toolbar.

## [1.2.3] - 2026-08-24

### Changed
- **Timeline View Default**: Made chronological Timeline view default with main/master as central tree trunk spine.
- **Iconography**: Replaced all emojis with sleek VS Code Codicon SVGs and typographic canvas pills.
- **Shortcuts**: Updated shortcut to `Cmd+Ctrl+G` (Mac) / `Ctrl+Alt+G` (Windows/Linux) with global scope.
- **Editor Integration**: Added 1-click BetterGitGraph icon to Editor Title toolbar.
- **Assets**: Updated 128x128 high-res PNG extension icon.

## [1.0.0] - 2026-08-24

### Added
- **Visual DAG Graph**: True topological DAG commit graph layout computed via Dagre with cubic Bézier edge routing.
- **Deterministic Branch Colors**: FNV-1a hash based color mapping for stable, persistent branch lane coloring across sessions.
- **High-Performance Canvas Renderer**: High-DPI HTML5 Canvas rendering with viewport culling, pulse glow selection rings, double-ring merge nodes, and ref badges.
- **Pan & Zoom Navigation**: Inertial mouse drag panning, cursor-centered scroll wheel zooming (0.2x–3.0x), and quick HEAD center controls.
- **Branch Explorer Sidebar**: Recursive remote branch tree structure rendering multi-level paths (e.g., `origin/feature/auth`) as folders with ahead/behind commit tracking.
- **Safe Git Operations**: Context menu supporting Checkout, Branch creation, Reverting, Cherry-picking, Tagging, and Soft/Mixed/Hard Resets.
- **Destructive Operation Safety**: Modal confirmation dialog with command previews and default-focused Cancel safety guards.
- **Beginner Mode**: Plain-English operation descriptions and hover glossary tooltips for Git concepts (HEAD, commit, branch, merge, rebase, stash, detached HEAD).
- **Commit Details & File Diffs**: Side panel showing author metadata, parent commit navigation chips, and changed files with status badges.
- **Instant Search & Filter**: Real-time commit message, author, short hash, and ref filtering with matching node highlights and dimming.
- **Audit Logging**: Local JSON audit logging of all UI-triggered git operations in `.git/bettergitgraph-op-log.json`.
- **Packaging & CI**: Complete GitHub Actions CI pipeline and `.vsix` packaging workflow.

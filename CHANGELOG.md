# Changelog

All notable changes to BetterGitGraph will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

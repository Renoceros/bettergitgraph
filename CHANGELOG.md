# Changelog

All notable changes to BetterGitGraph will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

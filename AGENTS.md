# BetterGitGraph Workspace Guidelines & Core Invariants

## 1. Zero-Emoji Invariant
- Never include emojis in UI labels, documentation, `README.md`, `CHANGELOG.md`, landing pages (`docs/`), code comments, or Git commit messages.
- Use clean typography, text badges, monospace indicators (e.g. `[?]`, `●`), or vector iconography instead.

## 2. Core Philosophy: Spatial Cognition & Pedagogical Git Empowerment
- BetterGitGraph is fundamentally a learning and empowerment tool for developers who struggle with the abstract mental model of the Git CLI.
- Frame all visual features, explanations, and documentation around **Spatial Cognition**:
  - **Central Trunk ($7\text{px}$):** Visual anchor of permanent repository history ("home").
  - **Feature Vines ($3\text{px}$):** Smooth Bézier curves indicating temporary exploratory offshoots and merges.
  - **WIP Node (@ HEAD):** Tangible physical crucible for uncommitted working tree changes.
  - **Geometric Shape Semantics:** Circles (Commits), Hexagons (PRs), Shields (Issues), Concentric Rings (Merges).
  - **Psychological Safety & Guardrails:** Two-stage confirmation state machines with plain-English impact translations for all destructive Git operations.

## 3. Documentation & Artifact Generation Workflow
- Always author and maintain full, chapter-structured Markdown (`.md`) documents before converting or compiling them to derivative formats (e.g., PDF).
- Keep documentation in sync with semantic versioning increments and release changelogs.

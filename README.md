# BetterGitGraph

<p align="center">
  <img src="resources/icon.png" width="96" height="96" alt="BetterGitGraph Logo" />
</p>

<p align="center">
  <strong>Beautiful, interactive, node-based Git graph for VS Code — built for everyone.</strong>
</p>

<p align="center">
  <a href="https://github.com/Renoceros/bettergitgraph"><img src="https://img.shields.io/badge/GitHub-Repository-blue?logo=github" alt="GitHub Repo" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License" /></a>
</p>

---

## 🌟 Why BetterGitGraph?

Most free Git extensions render history in flat, rigid table rows with unpredictable branch colors that change between sessions. **BetterGitGraph** brings a visual, interactive topological graph directly into your editor with:

- 🌳 **True DAG Node Graph** — commits as interactive nodes with smooth cubic Bézier lane curves (not table grids).
- 🎨 **Deterministic & Persistent Colors** — branch colors are deterministically mapped to branch names using FNV-1a hashing. Same branch name = same color across every session and machine.
- 🌲 **Tree-structured Remote Ref Explorer** — browse deep remote branch paths (like `origin/feature/auth/oauth`) as an intuitive collapsible file tree in the sidebar.
- ⚡ **First-Class Git Operations** — right-click any commit to Checkout, Branch, Tag, Revert, Cherry-pick, or Reset (Soft, Mixed, Hard).
- 🎓 **Beginner Mode** — plain-English operation descriptions, safety confirmation dialogs showing exact git commands before execution, and hover glossary definitions for Git terminology.
- 🔍 **Instant Search & Filtering** — filter by commit message, author, SHA, or ref with real-time node highlighting and dimming.
- ⚡ **High-DPI Canvas Rendering** — hardware-accelerated HTML5 Canvas with viewport culling, silky-smooth mouse drag pan, and cursor-centered wheel zoom.

---

## ⌨️ Shortcuts & Commands

| Command | Keybinding (Mac) | Keybinding (Win/Linux) | Description |
|---|---|---|---|
| `BetterGitGraph: Open Graph` | `Cmd+Shift+G G` | `Ctrl+Shift+G G` | Opens the full-screen BetterGitGraph visual panel |
| `BetterGitGraph: Fetch All Remotes` | — | — | Executes `git fetch --all --prune` and auto-refreshes |

---

## 🛠️ Git Operations & Safety

Right-clicking on any commit node opens a context menu with actions:

| Action | Git Command | Beginner Label |
|---|---|---|
| **Checkout** | `git checkout <hash>` | *"Go to this point in time"* |
| **Create Branch** | `git branch <name> <hash>` | *"Start a new branch from here"* |
| **Revert** | `git revert <hash>` | *"Safely undo this commit"* |
| **Cherry-Pick** | `git cherry-pick <hash>` | *"Copy this commit to current branch"* |
| **Tag** | `git tag <name> <hash>` | *"Mark this point with a tag"* |
| **Reset (Soft)** | `git reset --soft <hash>` | *"Keep my changes staged"* |
| **Reset (Mixed)** | `git reset --mixed <hash>` | *"Keep my changes unstaged"* |
| **Reset (Hard)** | `git reset --hard <hash>` | *"DISCARD all uncommitted changes"* (Requires confirmation) |

---

## 🚀 Development & Testing

```bash
# Clone the repository
git clone https://github.com/Renoceros/bettergitgraph.git
cd bettergitgraph

# Install dependencies
npm install

# Run unit tests (Vitest)
npm run test:unit

# Build extension host & webview bundles
npm run compile

# Launch Extension in VS Code debug host
# Press F5 in VS Code
```

See [`documentation/TECH_DOCS.md`](documentation/TECH_DOCS.md) for technical architecture details and [`.agent/CONTEXT.md`](.agent/CONTEXT.md) for agent context protocol.

---

## 📄 License

MIT © [Renoceros](https://github.com/Renoceros)

<p align="center">
  <img src="resources/icon.png" width="128" height="128" alt="BetterGitGraph Logo" />
</p>

<h1 align="center">BetterGitGraph</h1>

<p align="center">
  <strong>A modern, high-performance, node-based Git visualization & management extension for Visual Studio Code.</strong>
</p>

<p align="center">
  <a href="https://github.com/Renoceros/bettergitgraph/releases/latest"><img src="https://img.shields.io/badge/Release-v1.2.3-blue.svg" alt="Release Version" /></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=Renoceros.bettergitgraph"><img src="https://img.shields.io/badge/VS%20Code-%5E1.90.0-007ACC.svg?logo=visualstudiocode" alt="VS Code Version" /></a>
  <a href="https://github.com/Renoceros/bettergitgraph/actions"><img src="https://img.shields.io/badge/CI-Passing-brightgreen.svg" alt="CI Status" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License: MIT" /></a>
  <img src="https://img.shields.io/badge/Privacy-100%25%20Local-success.svg" alt="Privacy Local-First" />
</p>

---

## 🌟 Overview

Most Git graph extensions render commit history as rigid, tabular text logs with unpredictable, flickering branch colors that change between sessions. 

**BetterGitGraph** redesigns Git visualization from the ground up for **clarity, speed, and safety**:
- Commits are rendered as **fluid interactive topological nodes** with smooth Bézier curve routing on a hardware-accelerated canvas.
- Branch colors are **deterministic and persistent** across all sessions and machines.
- The `main`/`master` branch is visually established as a **solid, unbroken central trunk**, while feature branches branch out as vines and reattach upon merging.
- Safe Git operations (Checkout, Branch, Tag, Revert, Cherry-Pick, Reset) are one click away, backed by **plain-English beginner explanations** and **destructive-action guardrails**.

---

## ✨ Key Features

### 1. ⏱️ Dual Visualization Engines
Switch seamlessly between two purpose-built visualization paradigms:
- **Timeline View (Default):** Commits are ordered strictly chronologically descending (newest at the top, oldest at the bottom). Ideal for understanding the exact sequence of real-time developments across all branches.
- **Tree View (Topological DAG):** Commits are structured topologically based on parent-child ancestry relationships using Sugiyama layout algorithms. Ideal for inspecting complex feature branches, merges, and octopus merges.

### 2. 🌲 The Trunk & Vine Visual Hierarchy
- **The Central Trunk:** `main` (or `master`) is visually anchored as the repository's continuous central spine with a prominent, thicker stroke ($5.0\text{px}$).
- **Feature Vines:** Feature and bugfix branches fork outward into parallel lanes ($2.5\text{px}$) and curve gracefully back into the trunk when merged ("vines reattaching to the tree").

### 3. 🎨 Deterministic & Persistent Color Engine
- Branch colors are generated deterministically using **32-bit FNV-1a hashing** mapped to an accessible color palette.
- **Zero Session Drift:** The same branch name will always produce the exact same color, regardless of when it was created, how many other branches exist, or which computer you are using.

### 4. 🏷️ Human-Centric Node Labels
- **No SHA Clutter:** Commits prominently display clean typographic badges (`INITIAL`, `MERGE`, `OCTOPUS`, `COMMIT`), bold commit subjects, author names, and human-friendly relative timestamps (e.g., `2h ago`, `yesterday`).
- Full SHAs are available on-demand with one-click copy inside the details popover.

### 5. 🪟 Interactive Floating Node Popup
Click any commit node to display a floating details card:
- **Metadata:** Author, email, timestamp, and branch association.
- **Parent Navigation:** Clickable parent commit chips that instantly pan and center the viewport on parent commits.
- **Changed Files List:** Status badges (`A` Added, `M` Modified, `D` Deleted, `R` Renamed) with click-to-open diffs in VS Code.
- **Quick Action Bar:** One-click Checkout, Branch creation, Revert, and Hard Reset.

### 6. 🛡️ Safe Git Operations & Audit Trail
- **Right-Click Context Menu:** Perform standard and advanced Git operations without touching the terminal.
- **Destructive Action Guardrails:** High-risk actions (such as `git reset --hard` or `git branch -D`) require explicit confirmation in a modal dialog with command previews and default-focused Cancel safety guards.
- **Local Audit Log:** Every UI-triggered Git action is recorded locally in `.git/bettergitgraph-op-log.json` for auditing and rollback peace of mind.

### 7. 🌲 Recursive Remote Branch Explorer
- Built into the VS Code Source Control sidebar.
- Deep remote branches (e.g., `origin/feature/user/authentication`) are rendered as an **intuitive nested folder tree** rather than a flat, overwhelming list.
- Includes real-time **ahead/behind commit counters** relative to upstream.

### 8. 🔍 Instant Search & Multi-Filter
- Instant live search by commit subject, author, email, branch ref, or hash.
- Matches are highlighted with glowing indicator rings while non-matching commits are gently dimmed.

---

## ⌨️ Shortcuts & Commands

| Command | Keybinding (macOS) | Keybinding (Win/Linux) | Location |
|---|---|---|---|
| **BetterGitGraph: Open Graph** | <kbd>Cmd</kbd> + <kbd>Ctrl</kbd> + <kbd>G</kbd> | <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>G</kbd> | Editor Title Bar, SCM Bar, Command Palette |
| **BetterGitGraph: Fetch All Remotes** | — | — | Top Bar Button, SCM Title Bar |

---

## 🛠️ Supported Git Operations

| Action | Executed Git Command | Beginner Description | Confirmation Required |
|---|---|---|:---:|
| **Checkout** | `git checkout <hash>` | *"Go to this point in time"* | No |
| **Create Branch** | `git branch <name> <hash>` | *"Start a new branch from here"* | No |
| **Revert** | `git revert <hash>` | *"Safely undo this commit with an inverse change"* | Optional (Beginner Mode) |
| **Cherry-Pick** | `git cherry-pick <hash>` | *"Copy this commit onto your current branch"* | Optional (Beginner Mode) |
| **Tag** | `git tag <name> <hash>` | *"Add a permanent named bookmark"* | No |
| **Reset (Soft)** | `git reset --soft <hash>` | *"Move pointer; keep changes staged"* | Optional (Beginner Mode) |
| **Reset (Mixed)** | `git reset --mixed <hash>` | *"Move pointer; keep changes unstaged in working directory"* | Optional (Beginner Mode) |
| **Reset (Hard)** | `git reset --hard <hash>` | *"Move pointer; DISCARD all uncommitted changes"* | **Yes (Always)** |
| **Delete Branch** | `git branch -d <name>` | *"Remove an already-merged branch"* | No |
| **Force Delete Branch**| `git branch -D <name>` | *"Permanently remove an unmerged branch"* | **Yes (Always)** |

---

## ⚙️ Configuration & Settings

Configure BetterGitGraph via VS Code Settings (`Cmd+,` / `Ctrl+,` $\rightarrow$ search `BetterGitGraph`):

| Setting | Type | Default | Description |
|---|---|---|---|
| `bettergitgraph.layoutDirection` | `string` (`"TB" \| "LR"`) | `"TB"` | Graph flow direction: Top-to-Bottom or Left-to-Right. |
| `bettergitgraph.beginnerMode` | `boolean` | `true` | Show plain-English explanations and confirmation dialogs. |
| `bettergitgraph.maxCommits` | `number` | `2000` | Maximum number of commits loaded into the graph. |
| `bettergitgraph.nodeSize` | `number` | `12` | Radius of commit nodes in pixels. |

---

## 🔒 Security & Privacy

BetterGitGraph is built strictly as a **local-first** developer tool:

- **0 External Network Requests:** Zero telemetry, analytics, tracking, or remote server pings.
- **Strict Content Security Policy (CSP):** The Webview environment operates under a locked-down CSP (`default-src 'none'`) with cryptographically random 32-character nonces on all scripts.
- **Input Sanitization & Flag-Injection Defenses:** All user-supplied branch names, tag names, and hashes are validated and sanitized to prevent CLI argument injection.
- **Workspace Boundary Containment:** File diff and opening commands enforce strict workspace boundary containment to prevent path traversal attacks.

---

## 📦 Installation

### Method 1: VS Code Marketplace (Recommended)
1. Open Visual Studio Code.
2. Press <kbd>Cmd+P</kbd> (Mac) or <kbd>Ctrl+P</kbd> (Windows/Linux).
3. Paste the following and press <kbd>Enter</kbd>:
   ```
   ext install Renoceros.bettergitgraph
   ```

### Method 2: Install from GitHub Release (`.vsix`)
1. Download the latest `bettergitgraph-x.x.x.vsix` from [GitHub Releases](https://github.com/Renoceros/bettergitgraph/releases).
2. Install via terminal:
   ```bash
   code --install-extension bettergitgraph-1.2.3.vsix
   ```
   *(Or in VS Code: Extensions View $\rightarrow$ `...` menu $\rightarrow$ **Install from VSIX...**)*

---

## 🧑‍💻 Development & Contributing

### Requirements
- Node.js $\ge 20.0.0$
- npm $\ge 10.0.0$
- VS Code $\ge 1.90.0$

### Setup & Build
```bash
# 1. Clone the repository
git clone https://github.com/Renoceros/bettergitgraph.git
cd bettergitgraph

# 2. Install dependencies
npm install

# 3. Run unit test suite (Vitest)
npm run test:unit

# 4. Compile extension host (esbuild) & webview (Vite + React 19)
npm run compile

# 5. Launch debug host
# Open repository in VS Code and press F5
```

### Architecture
- **Extension Host (`src/extension/`):** Node.js CommonJS process bundled with `esbuild`. Handles Git CLI execution (`simple-git`), branch tree data provider, and message dispatch.
- **Webview UI (`src/webview/`):** React 19 application bundled with `Vite`. Uses HTML5 Canvas for high-DPI rendering, Zustand for reactive state management, and `@dagrejs/dagre` for graph positioning.

For detailed technical specifications, see [`documentation/TECH_DOCS.md`](documentation/TECH_DOCS.md) and [`documentation/PRD.md`](documentation/PRD.md).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

Made with ❤️ by [Renoceros](https://github.com/Renoceros).

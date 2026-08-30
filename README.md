<p align="center">
  <img src="resources/icon.png" width="128" height="128" alt="BetterGitGraph Logo" />
</p>

<h1 align="center">BetterGitGraph</h1>

<p align="center">
  <strong>A modern, high-performance, node-based Git visualization & management extension for Visual Studio Code.</strong>
</p>

<p align="center">
  <a href="https://renoceros.github.io/bettergitgraph/"><img src="https://img.shields.io/badge/Documentation-GitHub%20Pages-4ec9b0.svg?logo=github" alt="GitHub Pages Docs" /></a>
  <a href="https://github.com/Renoceros/bettergitgraph/releases/latest"><img src="https://img.shields.io/badge/Release-v1.3.2-blue.svg" alt="Release Version" /></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=Renoceros.bettergitgraph"><img src="https://img.shields.io/badge/VS%20Code-%5E1.90.0-007ACC.svg?logo=visualstudiocode" alt="VS Code Version" /></a>
  <a href="https://github.com/Renoceros/bettergitgraph/actions"><img src="https://img.shields.io/badge/CI-Passing-brightgreen.svg" alt="CI Status" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License: MIT" /></a>
  <img src="https://img.shields.io/badge/Privacy-100%25%20Local-success.svg" alt="Privacy Local-First" />
</p>

<p align="center">
  🌐 <strong><a href="https://renoceros.github.io/bettergitgraph/">Visit the Official BetterGitGraph Landing Page & Q&A Guide →</a></strong>
</p>

<p align="center">
  <img src="resources/page_example.jpeg" alt="BetterGitGraph Main Interface" width="100%" />
</p>

---

## ⌨️ Controls, Keybindings & Navigation

| Command / Action | Keybinding (macOS) | Keybinding (Win/Linux) | Description |
|---|---|---|---|
| **Open BetterGitGraph** | <kbd>Cmd</kbd> + <kbd>Ctrl</kbd> + <kbd>G</kbd> | <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>G</kbd> | Opens or reveals the interactive graph view |
| **Pan Canvas** | <kbd>Click</kbd> + <kbd>Drag</kbd> *(Canvas)* | <kbd>Click</kbd> + <kbd>Drag</kbd> *(Canvas)* | Smoothly pan across repository history |
| **Zoom In / Out** | <kbd>Scroll Wheel</kbd> / <kbd>Pinch</kbd> | <kbd>Scroll Wheel</kbd> / <kbd>Pinch</kbd> | Zoom into detailed plaques or out for wide overview |
| **Center HEAD Commit** | <kbd>Double Click</kbd> *(Canvas)* | <kbd>Double Click</kbd> *(Canvas)* | Instantly centers viewport on active `HEAD` commit |
| **Fit to Screen** | Click `⛶ Fit` button | Click `⛶ Fit` button | Dynamically fits all rendered nodes into viewport |
| **Inspect Commit Details** | <kbd>Click</kbd> *(Node / Plaque)* | <kbd>Click</kbd> *(Node / Plaque)* | Opens floating popup with changed files, parent chips & diff viewer |
| **Context Operations** | <kbd>Right Click</kbd> *(Node)* | <kbd>Right Click</kbd> *(Node)* | Opens Git operations menu (Checkout, Branch, Tag, Revert, Cherry-Pick, Reset) |
| **Canvas Export Menu** | <kbd>Right Click</kbd> *(Background)* | <kbd>Right Click</kbd> *(Background)* | Export vector SVG / PNG diagram or center graph |
| **Open Web Repository** | <kbd>Click</kbd> *(Repo Title)* | <kbd>Click</kbd> *(Repo Title)* | Opens remote origin repository directly in web browser |
| **Toggle View Mode** | <kbd>Click</kbd> `Timeline / Tree` | <kbd>Click</kbd> `Timeline / Tree` | Switches between chronological timeline & DAG topological tree |
| **Fetch All Remotes** | Click `Fetch All` button | Click `Fetch All` button | Fetches updates from all remotes in background |
| **Auto-Fetch Cycle** | Click `Auto: Off` button | Click `Auto: Off` button | Cycles background polling intervals (`Off` $\rightarrow$ `1m` $\rightarrow$ `5m` $\rightarrow$ `15m` $\rightarrow$ `30m` $\rightarrow$ `1h`) |

---

## 🌟 Overview

Most Git graph extensions render commit history as rigid, tabular text logs with unpredictable, flickering branch colors that change between sessions. 

**BetterGitGraph** redesigns Git visualization from the ground up for **clarity, speed, and safety**:
- Commits are rendered as **fluid interactive topological nodes** with smooth Bézier curve routing on a hardware-accelerated canvas.
- Branch colors are **deterministic and persistent** across all sessions and machines.
- The `main`/`master` branch is visually established as a **solid, unbroken central trunk**, while feature branches branch out as vines and reattach upon merging.
- Safe Git operations (Checkout, Branch, Tag, Revert, Cherry-Pick, Reset) are one click away, backed by **plain-English beginner explanations** and **destructive-action guardrails**.

---

## 🔍 Smart Search & Precision Filtering

BetterGitGraph provides a powerful multi-attribute search engine with real-time highlighting:

<p align="center">
  <img src="resources/author_tag_search.jpeg" alt="Author and Tag Search Highlighting" width="100%" />
</p>

### Search Syntax Cheat Sheet

| Syntax / Prefix | Target Scope | Example | Description |
|---|---|---|---|
| `@<name>` / `author:<name>` | Author Name & Email | `@renoce` | Highlights only commits authored by users matching `renoce` |
| `#<branch>` / `branch:<name>` | Branch & Ref Lineage | `#feature/login`, `#404` | Highlights all commits belonging to matching branch names |
| `file:<path>` / `/<path>` | Changed Files & Paths | `file:dag-layout.ts`, `/components` | Highlights commits that modified, added, or deleted matching files |
| `msg:<text>` / `title:<text>` | Commit Message / Title | `msg:merge`, `title:release` | Highlights commits matching exact message terms |
| `"phrase"` | Exact Phrase Match | `"fix token bug"` | Searches commit subjects for exact phrase |
| `is:<type>` / `type:<type>` | Node Geometry Type | `is:pr`, `is:issue`, `is:merge`, `is:initial` | Highlights specific node types (PRs, Issues, Merges, Roots) |
| `sha:<hash>` / `hash:<hash>` | Commit Hash | `sha:431511d` | Highlights specific commit hashes |
| *(no prefix)* | Universal Fuzzy Search | `refactor` | Searches across subject, author, branch, file, and SHA |

<p align="center">
  <img src="resources/general_search.jpeg" alt="General Search Across Repository" width="100%" />
</p>

> **Compound Queries:** You can combine multiple search tokens together (e.g. `@renoce is:pr file:dag-layout #main`) to filter complex repository histories instantly.

---

## ✨ Key Features

### 1. ⏱️ Dual Visualization Engines & 4-Direction Matrix
Switch seamlessly between two purpose-built visualization paradigms across 4 flow orientations (`↓ Top-to-Bottom`, `↑ Bottom-to-Top`, `→ Left-to-Right`, `← Right-to-Left`):
- **Timeline View:** Commits are ordered strictly chronologically descending (newest at the top, oldest at the bottom). Ideal for understanding the exact sequence of real-time developments across all branches.
- **Tree View (Topological DAG):** Commits are structured topologically based on parent-child ancestry relationships using Sugiyama layout algorithms. Ideal for inspecting complex feature branches, merges, and octopus merges.

### 2. 🌲 The Trunk & Vine Visual Hierarchy
- **The Central Trunk:** `main` (or `master`) is visually anchored as the repository's continuous central spine with a prominent, thicker stroke ($5.0\text{px}$).
- **Feature Vines:** Feature and bugfix branches fork outward into parallel lanes ($2.5\text{px}$) and curve gracefully back into the trunk when merged.

### 3. 🏷️ Orientation-Aware Plaques (No Label Clashing)
- Each commit's details are housed inside an encapsulated, sleek tag card with a connector notch.
- In vertical modes (`TB`/`BT`), plaques are placed to the **Right**. In horizontal modes (`LR`/`RL`), plaques are placed **Above or Below** nodes, alternating vertically so horizontal timeline lanes have **zero horizontal label collisions**!

### 4. ⬡ First-Class PR, Issue & WIP Nodes (Geometric Differentiation)
Adhering to data visualization best practices, node types are clearly differentiated by geometry and accent colors:

| Node Type | Geometric Shape | Accent Color | Visual Glyphs | Plaque Badge |
|---|---|---|---|---|
| **Working Tree (WIP)** | **Glowing Dashed Circle** $\bigodot$ | `#4ec9b0` (Emerald) | Dashed outer halo + inner edit dot | `WIP` (Emerald Pill) |
| **Standard Commit** | Solid Circle $\bigcirc$ ($R=8\text{px}$) | Branch Color | Solid single stroke ($1.5\text{px}$) | `COMMIT` (Blue) |
| **Root Commit** | Solid Circle with White Core | `#4ec9b0` | Double solid stroke ($2\text{px}$) | `INITIAL` (Emerald) |
| **Merge Commit** | Concentric Double Ring $\odot$ | Branch Color | Outer circle + inner ring | `MERGE` / `OCTOPUS` (Purple) |
| **Pull Request (PR)** | **Rounded Hexagon** $\varhexagon$ ($R=11\text{px}$) | `#8957e5` (Purple) | Hexagonal polygon path | `PR #123` (Purple Pill) |
| **Issue Node** | **Rounded Shield / Square** $\square$ ($R=10\text{px}$) | `#238636` (Green) | Rounded square card | `ISSUE #45` (Green Pill) |

### 5. 🎨 Deterministic & Persistent Color Engine
- Branch colors are generated deterministically using **32-bit FNV-1a hashing** mapped to an accessible color palette.
- **Zero Session Drift:** The same branch name will always produce the exact same color, regardless of when it was created, how many other branches exist, or which computer you are using.

### 6. 🪟 Interactive Floating Node Popup & Commit Studio Drawer
Click any commit node or WIP node to display detailed information:
- **WIP Node Click:** Opens the **Commit & Staging Studio Drawer** to stage/unstage files (`git add`), inspect diffs, use Conventional Commit chips, and commit/push.
- **Metadata:** Author, email, local/relative timestamp, and branch association.
- **Parent Navigation:** Clickable parent commit chips that instantly pan and center the viewport on parent commits.
- **Changed Files List & Live Filter:** Filter changed files with an in-card search input; click any file to open VS Code's diff editor.
- **Quick Action Bar:** One-click Checkout, Branch creation, Revert, Hard Reset, Raise PR, and Web Link.

### 7. 🖼️ Standalone Repo Map Export (SVG & PNG)
- Right-click anywhere on the canvas background to export your entire repository history as a high-resolution standalone vector `.svg` or `.png` diagram.
- SVG exports feature embedded CSS styling, `<clipPath>` containment, custom curve stroke widths, and precise font-metric truncation for presentation in browsers, reports, Figma, or documentation.

---

## 🛠️ Supported Git Operations

| Action | Executed Git Command | Beginner Description | Confirmation Required |
|---|---|---|:---:|
| **Stage File** | `git add <file>` | *"Stage file for the next commit"* | No |
| **Unstage File** | `git restore --staged <file>` | *"Unstage file back to working tree"* | No |
| **Commit Changes** | `git commit -m <message>` | *"Save staged snapshot with message"* | No |
| **Raise PR / Create MR** | Deep Link to GitHub / GitLab / Bitbucket / Azure | *"Open web comparison & PR creation"* | No |
| **Checkout** | `git checkout <hash>` | *"Go to this point in time"* | No |
| **Create Branch** | `git branch <name> <hash>` | *"Start a new branch from here"* | No |
| **Revert** | `git revert <hash>` | *"Safely undo this commit with an inverse change"* | Optional (Beginner Mode) |
| **Cherry-Pick** | `git cherry-pick <hash>` | *"Copy this commit onto your current branch"* | Optional (Beginner Mode) |
| **Tag** | `git tag <name> <hash>` | *"Add a permanent named bookmark"* | No |
| **Reset (Soft)** | `git reset --soft <hash>` | *"Move pointer; keep changes staged"* | Optional (Beginner Mode) |
| **Reset (Mixed)** | `git reset --mixed <hash>` | *"Move pointer; keep changes unstaged in working directory"* | Optional (Beginner Mode) |
| **Reset (Hard)** | `git reset --hard <hash>` | *"Move pointer; DISCARD all uncommitted changes"* | **2-Stage Confirmation** |
| **Force Push** | `git push --force-with-lease` | *"Overwrite remote branch history"* | **2-Stage Confirmation** |
| **Delete Branch** | `git branch -d <name>` | *"Remove an already-merged branch"* | No |
| **Force Delete Branch**| `git branch -D <name>` | *"Permanently remove an unmerged branch"* | **2-Stage Confirmation** |

---

## ⚙️ Configuration & Settings

Configure BetterGitGraph via VS Code Settings (<kbd>Cmd+,</kbd> / <kbd>Ctrl+,</kbd> $\rightarrow$ search `BetterGitGraph`):

| Setting | Type | Default | Description |
|---|---|---|---|
| `bettergitgraph.twoStageConfirmation` | `boolean` | `true` | Require a 2nd confirmation dialog before executing destructive Git actions (Reset Hard, Force Push, Force Delete Branch). |
| `bettergitgraph.mainTrunkStrokeWidth` | `number` | `7` | Stroke width (thickness) for the central main/master trunk curve in pixels ($2-16$). |
| `bettergitgraph.branchStrokeWidth` | `number` | `3` | Stroke width (thickness) for feature and bugfix branch curves in pixels ($1-10$). |
| `bettergitgraph.layoutDirection` | `string` (`"TB" \| "BT" \| "LR" \| "RL"`) | `"TB"` | Graph flow direction: Top-to-Bottom, Bottom-to-Top, Left-to-Right, or Right-to-Left. |
| `bettergitgraph.dateFormat` | `string` (`"local" \| "relative" \| "iso"`) | `"local"` | Format for commit timestamps: Local Time (`19:45 GMT+8`), Relative (`2h ago`), or ISO. |
| `bettergitgraph.autoFetchInterval` | `number` | `0` | Interval in minutes for background auto-fetching (`0` = disabled, `1`, `5`, `15`, `30`, `60`). |
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

## 📦 Installation & Setup

> 💡 *Looking for a step-by-step walkthrough for Windows, macOS, or Linux prerequisites (Git PATH, GitHub authentication)? Check out our **[Interactive Installation & Q&A Guide](https://renoceros.github.io/bettergitgraph/#install-guide)**.*

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
   code --install-extension bettergitgraph-1.3.2.vsix
   ```
   *(Or in VS Code: Extensions View $\rightarrow$ `...` menu $\rightarrow$ **Install from VSIX...**)*

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

Made with ❤️ by [Renoceros](https://github.com/Renoceros).

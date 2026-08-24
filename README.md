# BetterGitGraph

> Beautiful, interactive git graph for VS Code — built for everyone.

**BetterGitGraph** is a free, open-source VS Code extension that brings GitKraken-quality git visualization *inside* VS Code, designed for both power users and complete git beginners.

---

## Features

- 🌳 **Node-based graph** — commits as interactive nodes, not table rows
- 🎨 **Deterministic branch colors** — same branch = same color, every session, every machine
- 🌐 **All branches** — local, remote, stale refs, HEAD detached
- 🌲 **Remote ref file tree** — browse `origin/feature/auth/login` as a collapsible tree
- ⚡ **Git operations from the UI** — reset, checkout, cherry-pick, revert, tag — right from the graph
- 🧑‍🎓 **Beginner mode** — plain-English explanations, glossary tooltips, interactive walkthrough
- 🔍 **Search & filter** — by author, date, branch, commit message

## Getting Started

1. Install the extension from the VS Code Marketplace.
2. Open any folder containing a git repository.
3. Press `Cmd+Shift+G G` (Mac) / `Ctrl+Shift+G G` (Windows/Linux) to open the graph.

## Development

```bash
git clone https://github.com/Renoceros/bettergitgraph
cd bettergitgraph
npm install
# Press F5 in VS Code to launch extension in debug mode
```

See [`Documentation/TECH_DOCS.md`](Documentation/TECH_DOCS.md) for the full architecture guide.

## Contributing

See [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md). Before opening a PR, read [`.agent/CONTEXT.md`](.agent/CONTEXT.md) for the current state of the project.

## License

MIT

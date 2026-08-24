# Architecture Decision Records

## ADR-001: Branch Color Algorithm — FNV-1a
**Date:** 2026-08-24  
**Status:** Accepted  
**Decision:** Use FNV-1a 32-bit hash (not SHA-256 or random) for deterministic branch colors.  
**Reason:** Zero dependencies, ~10 lines of code, extremely fast, and produces good distribution across 0–360 hue space for typical branch names (`main`, `feature/auth`, `bugfix/xyz`).  
**Alternatives Considered:** SHA-256 (overkill, requires crypto), MD5 (deprecated), random with localStorage persistence (not portable across machines).  
**Consequences:** Color is deterministic per branch name — same branch name always gets same color on any machine, any session.

---

## ADR-002: Graph Renderer — Canvas API (not SVG)
**Date:** 2026-08-24  
**Status:** Accepted  
**Decision:** Use HTML5 `<canvas>` for graph rendering, not SVG.  
**Reason:** SVG DOM performance degrades significantly beyond ~500 nodes; canvas stays flat O(viewport) with culling. Repos can have 10,000+ commits.  
**Alternatives Considered:** SVG (poor perf at scale), D3.js (adds 100KB+ bundle, canvas still needed for perf), PixiJS (overkill for 2D graphs).  
**Consequences:** Node interaction (hover, click) requires manual hit-testing against node positions. Viewport culling must be implemented in renderer.

---

## ADR-003: Layout Engine — Dagre
**Date:** 2026-08-24  
**Status:** Accepted  
**Decision:** Use `@dagrejs/dagre` for DAG node layout.  
**Reason:** Mature, battle-tested Sugiyama-style layout library. Handles layered directed graphs with crossing minimization. Has TypeScript types.  
**Alternatives Considered:** elkjs (more powerful but ~600KB bundle), custom Sugiyama (200+ hrs of work), d3-dag (less maintained).  
**Consequences:** Layout is CPU-bound. For repos >2000 commits, layout should run in a Web Worker to avoid jank. Dagre adds ~50KB to the webview bundle.

---

## ADR-004: State Management — Zustand
**Date:** 2026-08-24  
**Status:** Accepted  
**Decision:** Use Zustand for webview state management.  
**Reason:** Minimal boilerplate, works fine outside React tree for message bus sync, 3KB bundle size. No reducers or actions boilerplate like Redux.  
**Alternatives Considered:** Redux Toolkit (overkill), Jotai (less familiar), Context API (performance issues with large state).  
**Consequences:** Store shape is defined in `src/webview/store/store.ts` — all state updates go through Zustand actions.

---

## ADR-005: Extension Host Bundler — esbuild
**Date:** 2026-08-24  
**Status:** Accepted  
**Decision:** Use esbuild for the extension host bundle; Vite for the webview.  
**Reason:** esbuild is the standard for VS Code extension host bundles (Node.js CJS). Vite is the standard for browser bundles with HMR for webview development.  
**Consequences:** Two separate build pipelines. `npm run watch` runs both concurrently via `npm-run-all`.

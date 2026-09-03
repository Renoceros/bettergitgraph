---
name: agentic-engineering-standard
description: >-
  Universal gold-standard blueprint for autonomous agentic engineering, artifact-driven
  project management, clean documentation architecture, zero-emoji typography, rigorous
  multi-layer testing, and CI/CD lifecycle automation. Apply to any software project.
---

# Universal Agentic Engineering & Quality Standard

## Overview & Foundational Philosophy

This specification defines the universal, domain-agnostic operational standard for autonomous agents collaborating with human engineers. It formalizes planning disciplines, workspace hierarchy, documentation architecture, testing pipelines, and release workflows into a reusable formula.

```
+-------------------------------------------------------------------------------+
|                 UNIVERSAL AGENTIC EXECUTION LIFECYCLE                         |
+-------------------------------------------------------------------------------+
|                                                                               |
|  [ 1. Ingestion & Alignment ]       Receive user intent & scope boundaries    |
|             │                                                                 |
|             ▼                                                                 |
|  [ 2. Progressive Planning ]        Strategic Roadmap -> Tactical Plan        |
|             │                       (Artifact Review & Approval)              |
|             ▼                                                                 |
|  [ 3. Atomic Implementation ]       Isolated code modifications               |
|             │                       (Zero speculative changes)                |
|             ▼                                                                 |
|  [ 4. Automated Verification ]      Strict quality gate validation:           |
|             │                       Types -> Lint -> Unit -> Build            |
|             ▼                                                                 |
|  [ 5. Conventional Release ]        Semantic versioning & changelog update    |
|             │                                                                 |
|             ▼                                                                 |
|  [ 6. Automated Deployment ]        CI test matrix -> Static Pages / Artifacts|
|                                                                               |
+-------------------------------------------------------------------------------+
```

---

## 1. Visual & Communication Invariants

### 1.1 The Strict Zero-Emoji Rule
* **Core Rule:** Never emit emoji characters (Unicode ranges `\U00010000-\U0010ffff`, `\u2600-\u27bf`, `\u2300-\u23ff`, etc.) in:
  - User interface labels, buttons, dialogs, tooltips, and status indicators.
  - Markdown documentation files (`README.md`, `CHANGELOG.md`, design specs, landing pages).
  - Code comments, docstrings, console logs, and exception strings.
  - Git commit messages, pull request titles, and branch descriptions.
* **Approved Replacement Styles:**
  - Status Indicators: Text tags (e.g., `[PASS]`, `[FAIL]`, `[ACTIVE]`, `[PENDING]`).
  - Monospace Glyphs: Bullet points (`•`, `●`), ASCII symbols (`->`, `=>`, `[?]`, `[!]`).
  - Web UI / Graphical: Native vector SVG icons, CSS pseudo-elements, or geometric badges.

### 1.2 Communication Protocol with Human Engineers
* **Conciseness & Precision:** State actions taken, files modified, test results, and next steps clearly. Avoid excessive conversational filler.
* **Clickable Resource Links:** Every referenced file, test fixture, or code symbol must be formatted with clickable file URI links (e.g., `[src/core/engine.ts](file:///path/to/src/core/engine.ts)`).
* **Transparent Verification:** Always display the raw or summarized test execution output confirming passes before declaring tasks complete.

---

## 2. The Artifact-Driven Planning Protocol

Autonomous agents must never write speculative code without an approved architectural plan. Every feature or refactor follows the two-tier planning protocol:

### 2.1 Strategic Roadmap (`roadmap_vX.Y.Z.md`)
* High-level epic tracking document outlining:
  - Problem statement & success metrics.
  - Feature capability breakdown across sub-releases.
  - Non-functional requirements (performance benchmarks, security boundaries).

### 2.2 Tactical Implementation Plan (`plan_vX_Y_Z.md`)
* Executable step-by-step document structured as follows:
  1. **User Request & Scope:** Exact intent and bounded constraints.
  2. **Affected Files & Architecture:** List of files to create, edit, or delete with rationales.
  3. **Implementation Phases:** Chronological, atomic code changes grouped into testable steps.
  4. **Quality Gates & Verification Strategy:** Exact terminal commands (`npm run test`, `pytest`, `cargo test`) and expected test outputs.
  5. **Rollback & Edge Case Mitigation:** Failure handling and fallback strategies.

```
[ User Request ] -> [ Create Plan Artifact ] -> [ Request Human Feedback ] -> [ Execute Code ]
```

---

## 3. Universal Workspace & Repository Hierarchy

Every production codebase should enforce clean separation between runtime host, presentation frontend, shared contracts, documentation, and continuous integration:

```
project-root/
├── .agent/
│   ├── rules/                   # Persistent workspace rules & behavioral constraints
│   └── skills/                  # Domain-specific & universal agent execution skills
├── .github/
│   └── workflows/
│       ├── ci.yml               # Automated multi-platform lint, typecheck & test matrix
│       └── pages.yml            # Zero-config static documentation auto-deployer
├── docs/                        # Self-contained landing page & interactive user guides
│   ├── index.html               # Zero-dependency interactive web documentation
│   └── resources/               # High-DPI diagram assets, vector logos & media
├── src/
│   ├── core/                    # Pure, platform-agnostic business logic & algorithms
│   ├── host/                    # Host integration layer (Node, Electron, VS Code, CLI)
│   ├── presentation/            # User interface components (React, Svelte, Canvas, Webview)
│   └── shared/                  # Immutable type definitions, DTOs & IPC contracts
├── tests/
│   ├── unit/                    # Fast, deterministic isolated unit test suites
│   ├── integration/             # IPC protocol, state-store, and multi-module tests
│   └── fixtures/                # Mock data, stubs, and deterministic snapshots
├── CHANGELOG.md                 # Keep a Changelog standard release ledger
├── package.json / Cargo.toml    # Manifest, dependencies, and script targets
└── README.md                    # Primary repository overview, installation & API guide
```

---

## 4. Documentation Architecture Standards

### 4.1 Root `README.md` Anatomy
Every project root `README.md` must follow this standardized section structure:
1. **Hero Header:** Centered logo, project title, and a single-sentence value proposition.
2. **Status Badges:** Live version badge, CI build status, platform compatibility, license type, and local-first privacy badge.
3. **Primary Showcase:** High-resolution screenshot or visual demonstration with zero placeholder assets.
4. **Key Features Grid:** Concise value-focused capability summaries with bold technical terminology.
5. **Interactive Controls / Keybindings Table:** Platform-specific shortcuts contrasting macOS, Windows, and Linux.
6. **Installation & Prerequisites:** Multi-method guide (Marketplace, Package Manager, CLI binary, Offline bundle).
7. **Configuration & Settings:** Matrix detailing every configurable key, data type, default value, and description.
8. **Security, Privacy & Local Execution:** Explicit disclosure of network behavior (guaranteeing 0 telemetry if local-first), sandboxing, and input sanitization.
9. **License & Credits:** Clean MIT/Apache badge with contributor attribution.

### 4.2 Semantic `CHANGELOG.md` Architecture
* Follow the **Keep a Changelog** standard combined with **Semantic Versioning** (`MAJOR.MINOR.PATCH`):
  - `MAJOR`: Incompatible API or structural changes.
  - `MINOR`: Backward-compatible new capabilities.
  - `PATCH`: Backward-compatible bug fixes and performance enhancements.
* Group changes under discrete category headers:
  - `### Added`: New user-facing or programmatic features.
  - `### Changed`: Changes in existing functionality.
  - `### Fixed`: Bug fixes, layout corrections, and crash mitigations.
  - `### Security`: Vulnerability patches and CSP enhancements.
  - `### Documentation`: Updates to guides, landing pages, and specifications.

### 4.3 Interactive Web Landing Site (`docs/index.html`)
* Maintain a zero-dependency static documentation page under `docs/` featuring:
  - Visual identity mirroring the product's UI design system.
  - Click-to-copy terminal install commands.
  - Interactive tabbed installation guide for all supported operating systems.
  - Searchable Q&A accordion answering prerequisites, troubleshooting, and edge cases.

---

## 5. Testing & Quality Gate Pipeline

No code changes are committed to version control without passing the **Four-Tier Verification Gate**:

```
+-------------------------------------------------------------------------------+
|                       FOUR-TIER VERIFICATION GATE                             |
+-------------------------------------------------------------------------------+
|                                                                               |
|  [ Tier 1: Static Typecheck ]      tsc --noEmit / mypy / cargo check          |
|                 │                                                             |
|                 ▼                                                             |
|  [ Tier 2: AST Linter ]            eslint . / ruff / cargo clippy             |
|                 │                                                             |
|                 ▼                                                             |
|  [ Tier 3: Unit Test Suites ]      vitest / pytest / cargo test (100% pass)   |
|                 │                                                             |
|                 ▼                                                             |
|  [ Tier 4: Production Build ]      esbuild / vite build / webpack             |
|                                                                               |
+-------------------------------------------------------------------------------+
```

### 5.1 Unit Test Writing Rules
1. **Deterministic Execution:** Tests must never depend on external network endpoints, dynamic time-zones, or random seeds without fixed fixtures.
2. **Pure Function Isolation:** Core algorithms (parsers, hashing, layouts, data transforms) must reside in pure functions tested with 100% boundary condition coverage.
3. **Regression Proofing:** When fixing any bug, author an automated unit test reproducing the exact failure mode before implementing the fix.

---

## 6. Conventional Git Commit & Release Protocol

### 6.1 Conventional Commit Format
All commit messages must strictly adhere to the Conventional Commits specification:
```
<type>(<scope>): <short imperative summary without capitalization or period>

[optional body providing technical rationale]
```
* **Types:**
  - `feat`: A new feature for the user or consumer.
  - `fix`: A bug fix.
  - `docs`: Documentation-only changes.
  - `style`: Formatting, whitespace, and UI visual styling.
  - `refactor`: Code restructuring without behavioral changes.
  - `test`: Adding or correcting tests.
  - `chore`: Build scripts, dependencies, and configuration maintenance.

### 6.2 Atomic Commit Cadence
* Commit immediately after completing and verifying a discrete logical phase.
* Never bundle unrelated refactors, dependency updates, and feature code into a single monolithic commit.

---

## 7. CI/CD Lifecycle Automation

### 7.1 Continuous Integration Matrix (`.github/workflows/ci.yml`)
* Run on all pull requests and pushes across supported platforms (Ubuntu, macOS, Windows).
* Enforce step sequence:
  1. Dependency installation (`npm ci`, `cargo fetch`).
  2. Static linting & code formatting verification.
  3. Typecheck compilation.
  4. Unit and integration test execution.
  5. Artifact compilation and bundle size budget checks.

### 7.2 Zero-Config Documentation Deployment (`.github/workflows/pages.yml`)
* Automatically trigger on pushes to `main`/`master` affecting `docs/**`.
* Deploy static landing pages and user guides to GitHub Pages with zero manual intervention.

# BetterGitGraph — Agent Protocol

> **This document is law for all agents working on this repo.**
> Read it in full before your first session. Re-read the relevant section before each action.
> When in doubt: stop, re-read, then act. Never guess on irreversible actions.

---

## Table of Contents

1. [The Golden Rules](#1-the-golden-rules)
2. [Session Lifecycle](#2-session-lifecycle)
3. [Branch & Commit Workflow](#3-branch--commit-workflow)
4. [Testing Protocol](#4-testing-protocol)
5. [Bug Catching Protocol](#5-bug-catching-protocol)
6. [PR Protocol](#6-pr-protocol)
7. [Scope Discipline](#7-scope-discipline)
8. [State Management (Keeping Context Alive)](#8-state-management-keeping-context-alive)
9. [Taboos — Absolute Prohibitions](#9-taboos--absolute-prohibitions)
10. [Code Quality Gate](#10-code-quality-gate)
11. [Emergency Protocol](#11-emergency-protocol)
12. [Quick-Reference Checklists](#12-quick-reference-checklists)

---

## 1. The Golden Rules

These seven rules override everything else. Memorize them.

```
1. READ before you WRITE.
2. One task per branch. One branch per PR. One PR per milestone task.
3. Never merge to main yourself. Open a PR.
4. Never commit failing types, lint, or tests.
5. If you break something unrelated to your task, file a bug — don't silently fix it in your branch.
6. Leave the codebase in a better state than you found it. No net degradation.
7. Update CONTEXT.md and TASKS.md at the end of every session. No exceptions.
```

---

## 2. Session Lifecycle

### 2.1 Session Start — Orientation Phase

Do this every single session, in this order. Do not skip steps.

```
┌─────────────────────────────────────────────────────────────────┐
│  SESSION START CHECKLIST                                        │
├─────────────────────────────────────────────────────────────────┤
│  [ ] 1. Read .agent/CONTEXT.md — current state of the project  │
│  [ ] 2. Read .agent/TASKS.md — find your assigned task card    │
│  [ ] 3. Read the task card fully:                               │
│         Branch / Branch from / Layer / Files / Done criteria    │
│  [ ] 4. Read every source file listed under "Files" in the card │
│  [ ] 5. Read TECH_DOCS.md §5 for the relevant subsystem        │
│  [ ] 6. Run: git status (confirm you are on the right branch)  │
│  [ ] 7. Run: git pull origin main (sync before branching)      │
│  [ ] 8. Create your task branch (see §3)                        │
└─────────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> If CONTEXT.md and the actual state of the codebase disagree, **trust the code, not the doc**. Note the discrepancy, update CONTEXT.md, then proceed.

### 2.2 During Work — Execution Phase

| Situation | Action |
|-----------|--------|
| You're about to edit a file not listed in your task card | See §7 Scope Discipline |
| You find a bug unrelated to your task | See §5 Bug Catching Protocol |
| A type or lint error blocks you | Fix it *only if it's in a file you were already touching*; otherwise file a bug |
| You need to make an architectural decision | Write an ADR in DECISIONS.md *before* implementing |
| You are unsure about requirements | Check PRD.md and TECH_DOCS.md first. If still unclear, document your assumption in a code comment and flag it in the PR description |
| You've been working > 2 hours with no commit | Something is wrong. Commit a WIP, re-read the task, re-scope |

### 2.3 Session End — Handoff Phase

```
┌─────────────────────────────────────────────────────────────────┐
│  SESSION END CHECKLIST                                          │
├─────────────────────────────────────────────────────────────────┤
│  [ ] 1. All acceptance criteria in the task card are met        │
│  [ ] 2. Quality Gate passed (see §10)                           │
│  [ ] 3. TASKS.md updated (checkbox + milestone status row)      │
│  [ ] 4. CONTEXT.md updated (Last Updated, What's Working, etc.) │
│  [ ] 5. New ADRs added to DECISIONS.md (if any decisions made)  │
│  [ ] 6. PR opened (see §6 PR Protocol)                          │
│  [ ] 7. Branch pushed: git push origin <branch>                 │
└─────────────────────────────────────────────────────────────────┘
```

If you cannot complete the task in one session, do this instead:

```
┌─────────────────────────────────────────────────────────────────┐
│  PARTIAL SESSION END (task incomplete)                          │
├─────────────────────────────────────────────────────────────────┤
│  [ ] 1. Commit whatever is stable (even if partial)             │
│         Use commit message: "wip(scope): <what's done so far>"  │
│  [ ] 2. Push the branch                                         │
│  [ ] 3. Update CONTEXT.md: note exactly where you stopped       │
│         and what the next agent needs to know to resume         │
│  [ ] 4. Add a "RESUME FROM HERE" comment in the relevant file   │
│         with a note about what needs doing next                 │
│  [ ] 5. Update TASKS.md task card status to 🔄 In Progress      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Session Lifecycle (cont.)

---

## 3. Branch & Commit Workflow

### 3.1 Creating a Branch

```bash
# Always sync main first
git checkout main
git pull origin main

# Create task branch (name comes from TASKS.md task card)
git checkout -b feat/m1/commit-graph-parser
```

**Never start work on `main` directly. Never.**

### 3.2 Commit Discipline

**Commit frequency:** Commit after every self-contained logical change. A session should produce multiple small commits, not one giant blob at the end.

**Commit message format (Conventional Commits):**

```
<type>(<scope>): <short imperative description>

[optional body — explain WHY not WHAT]

[optional footer — e.g. Closes #12, Refs ADR-003]
```

| Type | Use for |
|------|---------|
| `feat` | New functionality |
| `fix` | Bug fix |
| `test` | Adding or fixing tests |
| `refactor` | Code restructure, no behavior change |
| `docs` | Documentation only |
| `chore` | Tooling, deps, config |
| `perf` | Performance improvement |
| `style` | Formatting only (whitespace, semicolons) |
| `revert` | Reverting a previous commit |

**Good commit messages:**
```
feat(git-data): handle root commits in getCommitFiles using --root flag
test(color-engine): add determinism test — 1000 calls same branch same color
fix(dag-layout): prevent overlapping nodes when multiple branches share a commit
```

**Bad commit messages (never do these):**
```
fix stuff
update
WIP
changes
agent session
```

### 3.3 When to Push

Push your branch at minimum:
- At the end of each work session
- Before opening a PR
- Whenever you make a commit you want preserved (don't risk local-only loss)

```bash
git push origin feat/m1/commit-graph-parser
```

### 3.4 Keeping Branches Up to Date

If `main` has moved while you were working on your branch (e.g. another PR merged):

```bash
# Rebase, don't merge — keeps history clean
git fetch origin
git rebase origin/main

# If conflicts: resolve them, then
git rebase --continue
```

> [!WARNING]
> Never `git merge main` into a feature branch. Always rebase.

---

## 4. Testing Protocol

### 4.1 Test-First Mindset

Before writing implementation code, write (or at minimum outline) the tests for the task.
This is not a strict TDD mandate — but tests must exist before a PR is opened.

The acceptance criteria in the task card **are** the tests. Write tests that assert exactly those criteria.

### 4.2 What to Run and When

| Moment | Command | Must Pass? |
|--------|---------|-----------|
| Before any commit | `npm run check-types` | ✅ Yes — no exceptions |
| Before any commit | `npm run lint` | ✅ Yes — no exceptions |
| Before opening a PR | `npm run test:unit` | ✅ Yes |
| Before opening a PR | `npm run compile` | ✅ Yes |
| Before merging (CI) | Full suite (CI handles this) | ✅ Yes |
| After rebasing | `npm run check-types && npm run lint` | ✅ Yes |
| After installing deps | `npm run check-types` | ✅ Yes |

### 4.3 Writing Tests

**Location rules:**

| Test type | Location | Runner |
|-----------|----------|--------|
| Unit tests (pure logic, mocked deps) | `tests/unit/*.test.ts` | `npm run test:unit` (Vitest) |
| Integration tests (real VS Code instance) | `tests/integration/*.test.ts` | `npm test` |
| E2E tests (Playwright, full webview) | `tests/e2e/*.spec.ts` | `npm run test:e2e` |

**Unit test rules:**
- No real git processes in unit tests — mock `simple-git` outputs
- No real file system access — use `test-fixtures/` static data or in-memory mocks
- Each test file tests exactly one module
- Tests are deterministic — no random data, no `Date.now()` without mocking

**Test naming convention:**
```typescript
describe('GitDataLayer', () => {
  describe('getCommitGraph', () => {
    it('returns empty arrays for a repo with no commits', async () => { ... });
    it('correctly parses a root commit (no parents)', async () => { ... });
    it('correctly parses a 2-parent merge commit', async () => { ... });
    it('correctly parses an octopus merge (3+ parents)', async () => { ... });
  });
});
```

### 4.4 Handling Failing Tests

**Tests you wrote fail:** Fix them before committing. Do not disable or skip tests to make CI green.

**Pre-existing tests fail after your changes:**
1. Determine if your change legitimately broke the contract those tests guard.
2. If yes — the tests are right, your code is wrong. Fix your code.
3. If the test is testing the wrong thing — update the test AND document why in a comment.
4. Never delete a test to make CI pass. Never use `it.skip()` without a comment explaining exactly when it will be un-skipped.

**Flaky tests (pass sometimes, fail sometimes):**
- Do not merge a PR while a flaky test is present in your branch.
- File a bug (see §5) with reproduction steps and mark the test `it.skip('FLAKY: #<issue-number>')`.

---

## 5. Bug Catching Protocol

### 5.1 Bug Severity Classification

| Severity | Definition | Example | Response time |
|----------|-----------|---------|--------------|
| **P0 — Critical** | Data loss, repo corruption, security issue | Hard reset runs without confirmation | Block everything, fix now |
| **P1 — High** | Feature completely broken, no workaround | Graph doesn't render on any repo | Fix before next milestone |
| **P2 — Medium** | Feature degraded, workaround exists | Branch colors reset on window reload | Fix within current milestone |
| **P3 — Low** | Cosmetic, edge case | Label truncated at exactly 47 chars | Backlog, fix in polish phase |

### 5.2 What to Do When You Find a Bug

**Scenario A — Bug is in a file you are currently editing (in-scope):**
- Fix it as part of your current commit.
- Note it in your PR description under "Also fixed".

**Scenario B — Bug is in a file NOT in your task card (out-of-scope):**

```
DO NOT silently fix it in your feature branch.

1. Document it: create a bug report entry in .agent/BUGS.md (see §5.3 format)
2. Note it in CONTEXT.md under "Known Issues"
3. Continue your current task unmodified
4. Mention it in your PR description under "Bugs discovered (not fixed)"
```

**Why?** Fixing unrelated bugs in a feature branch contaminates the PR, makes review harder, and can introduce regressions in code that wasn't being tested in that context.

**Scenario C — Bug makes your task impossible to complete:**
- Document the blocker in CONTEXT.md.
- File the bug report (§5.3).
- Open a draft PR with what you have, mark it `BLOCKED`.
- Update TASKS.md task card status to 🚫 Blocked.

### 5.3 Bug Report Format (`.agent/BUGS.md`)

```markdown
## BUG-<NNN> — <short title>

**Severity:** P0 / P1 / P2 / P3
**Discovered:** YYYY-MM-DD by <agent session id / human>
**Status:** Open / In Progress / Fixed (PR #<n>) / Wont Fix
**Affects:** <file(s) or feature>
**Milestone where found:** M<n>

### Reproduction
1. Step one
2. Step two
3. Observe: <wrong behavior>
4. Expected: <correct behavior>

### Root Cause (if known)
<explanation or "unknown">

### Notes
<anything else relevant>
```

### 5.4 Bug Fix Branches

Bug fixes get their own branches, always:

```
fix/<milestone-where-found>/<slug>
# e.g.
fix/m3/canvas-zoom-crash
fix/m1/root-commit-no-parent-crash
```

Branch from `main` (not from the feature branch where the bug was found).

---

## 6. PR Protocol

### 6.1 When to Open a PR

- When **all acceptance criteria** in the task card are met.
- When the Quality Gate (§10) has fully passed.
- When the branch is pushed to origin.

Do not open a PR:
- While tests are failing.
- While `npm run check-types` has errors.
- Before the task is complete (exception: draft PRs to show progress or get early feedback).

### 6.2 PR Title Format

```
[M<n>] <type>(<scope>): <description>
```

Examples:
```
[M1] feat(git-data): harden commit graph parser + root commit fix
[M3] feat(renderer): canvas renderer with zoom/pan and viewport culling
[M5] fix(operations): prevent hard reset without confirmed flag
```

### 6.3 PR Description Template

Every PR must include this template. No blank sections — if something doesn't apply, write "N/A".

```markdown
## Summary
<!-- 2–4 sentences: what this PR does and why -->

## Task Card
<!-- Link to the task in .agent/TASKS.md -->
TASKS.md: M<n>-T<n> — <task name>

## Changes
<!-- List every file changed with a one-line reason -->
- `src/extension/git-data.ts` — fixed root commit ^hash crash
- `tests/unit/git-data.test.ts` — added octopus merge test case

## Acceptance Criteria Met
<!-- Copy the "What done looks like" bullets from the task card and check them -->
- [x] `getCommitGraph()` handles root commit (no parents)
- [x] `getCommitGraph()` handles octopus merge (3+ parents)
- [x] All unit tests pass

## Testing Done
<!-- Exact commands run and their result -->
```
npm run check-types  → exit 0
npm run lint         → exit 0
npm run test:unit    → 12 passed, 0 failed
```

## Bugs Discovered (Not Fixed)
<!-- Any bugs found out-of-scope — reference BUG-NNN from BUGS.md -->
- BUG-001: canvas zoom crashes on empty repo (logged in BUGS.md)

## Also Fixed (In-Scope Opportunistic)
<!-- Minor fixes made while in a file you were already editing -->
- Removed stale TODO comment in git-data.ts

## Breaking Changes
<!-- Any API/interface/behavior changes that affect other layers -->
- N/A

## ADRs Added
<!-- Any new entries in DECISIONS.md -->
- N/A

## Screenshots / Recordings
<!-- Required for any UI-facing changes -->
- N/A
```

### 6.4 PR Mergeability Rules

A PR is **ready to merge** when ALL of the following are true:

| Check | Status |
|-------|--------|
| CI passes (lint + types + tests) | ✅ |
| All acceptance criteria checked | ✅ |
| PR description complete | ✅ |
| No unresolved review comments | ✅ |
| TASKS.md and CONTEXT.md updated | ✅ |
| Branch rebased onto latest `main` | ✅ |

A PR is **blocked** if ANY of the following are true:

| Blocker | Action |
|---------|--------|
| CI failing | Fix before requesting review |
| Acceptance criteria incomplete | Do not open PR yet |
| Out-of-scope file changes | Remove them, open separate PR |
| Missing tests for new code | Add tests |
| Hardcoded values (magic strings/numbers without constants) | Extract to named constants |
| `any` TypeScript type | Replace with proper type |
| `console.log` left in production code | Remove (use `console.warn`/`error` only) |

### 6.5 Review Etiquette (Agent as Author)

- Respond to every review comment — even if you disagree, explain why.
- If a human reviewer requests a change: make the change, push, re-request review.
- If a human reviewer requests a change you believe is wrong: explain in a comment referencing TECH_DOCS.md or an ADR. Do not silently ignore it.
- Resolve a comment thread only when the change is made, not when you've replied.

---

## 7. Scope Discipline

### 7.1 The Prime Directive

> **Do exactly what the task card says. Nothing more. Nothing less.**

Your task card lists exact files. Those are the only files you should be modifying (with very narrow exceptions below).

### 7.2 Allowed Out-of-Scope Edits

| Situation | Rule |
|-----------|------|
| You need to import a new type from a shared file | OK — importing is not modifying |
| You found a typo/comment error in a file you're touching | OK — fix it in the same commit, note in PR |
| A file you're touching has a trivial lint issue (unused import) | OK — fix it, note in PR |
| A file you're touching has a `// TODO` that your task now fulfils | OK — remove the TODO |

### 7.3 Never Allowed Without a New Task Card

| Situation | Rule |
|-----------|------|
| You want to "improve" the architecture of a module not in your task | STOP. Write an ADR proposal, open a discussion. Do not refactor without a task card. |
| You found a bug in another module | File BUG-NNN. Do not fix. |
| You want to add a feature not in the PRD | STOP. Do not add it. |
| You want to rename files/directories | Requires explicit refactor task card. |
| You want to change a public interface/type | Requires explicit task card — this is a breaking change. |

### 7.4 What To Do When You Discover Necessary Out-of-Scope Work

1. Note it in a `// TODO(M<n>): <description>` comment at the relevant line.
2. Add it to TASKS.md as a new task card under the appropriate milestone (or create a new one).
3. Add it to CONTEXT.md under "Known Issues / TODOs".
4. Continue your current task.

---

## 8. State Management (Keeping Context Alive)

This is the most critical operational discipline. Lost context = wasted agent cycles.

### 8.1 CONTEXT.md Update Rules

Update CONTEXT.md at the END of every session. Required fields:

| Field | Update rule |
|-------|-------------|
| `Last Updated` | Always — date + agent session ID if available |
| `Current State → Branch` | Always — what branch are you on when you stop? |
| `Current State → Last Milestone Completed` | When a milestone fully merges to main |
| `Current State → Next Milestone` | When you change milestones |
| `What's Working` | Check off items that are now done; add new items |
| `Active Design Decisions` | Add any new decisions made |
| `Known Issues / TODOs` | Add newly discovered issues; remove resolved ones |

**CONTEXT.md must be accurate enough that a fresh agent starting a new session can orient in under 5 minutes.**

### 8.2 TASKS.md Update Rules

| Event | Update |
|-------|--------|
| Task starts | Change task status row in Milestone Roadmap to 🔄 |
| Acceptance criterion met | Check the bullet `[x]` under "What done looks like" |
| Task complete (PR opened) | Change status row to 🔄 (pending merge) |
| PR merged to main | Change status row to ✅; remove from "In Progress" |
| New task discovered | Add a new task card to the appropriate milestone |
| Task descoped | Change status row to ❌, add a note |

### 8.3 DECISIONS.md Update Rules

Write a new ADR **before implementing** the decision, not after. If you catch yourself implementing something significant without an ADR, stop and write it first.

ADR status values:
- `Proposed` — written but not yet implemented
- `Accepted` — agreed and implemented
- `Deprecated` — superseded by a newer ADR (link to replacement)
- `Rejected` — considered and not taken (still record it — it stops future agents from rehashing the same discussion)

### 8.4 BUGS.md Maintenance

- Every new bug discovered gets an entry in `.agent/BUGS.md`.
- When a bug is fixed (PR merged), update its `Status` field to `Fixed (PR #<n>)`.
- Do not delete fixed bug entries — they serve as a historical record.

---

## 9. Taboos — Absolute Prohibitions

These are hard rules. There are no exceptions. If you find yourself about to do any of these, stop immediately.

### 🚫 NEVER — Repository Safety

| Taboo | Why |
|-------|-----|
| `git push --force` to `main` | Destroys shared history |
| `git push --force` to any branch with an open PR | Breaks reviewer context |
| `git reset --hard` on `main` | Destroys commits |
| Committing secrets, API keys, tokens, passwords | Security breach |
| Committing `.env` files | Contains secrets |
| Committing `node_modules/` | Enormous, regenerable |
| Committing `dist/` or `out/` | Build artifacts, regenerable |
| Merging your own PR to `main` | No self-merge — requires review |
| Bypassing CI to force-merge | CI exists for a reason |

### 🚫 NEVER — Code Quality

| Taboo | Why |
|-------|-----|
| Using `any` TypeScript type | Defeats the purpose of TypeScript |
| Using `// @ts-ignore` | Hides real errors |
| Using `// @ts-nocheck` | Disables TypeScript for the whole file |
| Using `/* eslint-disable */` for anything beyond a single justified line | Masks real issues |
| `console.log` in committed code | Noisy in production; use `console.warn`/`error` |
| Magic strings or numbers without named constants | Makes code unmaintainable |
| Catching errors and silently swallowing them (`catch(e) {}`) | Hides bugs |
| TODO comments without a milestone reference (`// TODO(M5): ...`) | Untracked debt |
| `it.skip()` without a comment and a bug reference | Silently disabled tests |

### 🚫 NEVER — Git Operations Exposed to Users

| Taboo | Why |
|-------|-----|
| Executing `git push --force` from the extension's OperationExecutor | Can destroy remote history for users |
| Running any destructive git op without `confirmed === true` | Data loss for users |
| Writing to `.git/` directly (not via simple-git) | Corruption risk |
| Running git commands with `shell: true` and user-provided input | Shell injection |

### 🚫 NEVER — Agent Conduct

| Taboo | Why |
|-------|-----|
| Ending a session without updating CONTEXT.md | Next agent loses context |
| Making assumptions about file content without reading the file first | Stale context errors |
| Guessing a TypeScript type | Use proper type inference or explicit types |
| Implementing a feature that isn't in the PRD without raising it first | Scope creep |
| Deleting files without a task card authorizing it | Irreversible |
| Batch-editing unrelated files in a single commit | Contaminates history |

---

## 10. Code Quality Gate

Run this checklist before **every commit**. Not before every PR — before every commit.

```
┌─────────────────────────────────────────────────────────────────┐
│  PRE-COMMIT QUALITY GATE                                        │
├─────────────────────────────────────────────────────────────────┤
│  [ ] npm run check-types → exit 0 (zero TypeScript errors)     │
│  [ ] npm run lint → exit 0 (zero ESLint errors)                 │
│  [ ] No `any` types introduced                                  │
│  [ ] No `console.log` statements                                │
│  [ ] No commented-out code blocks                               │
│  [ ] No magic strings or numbers (use named constants)          │
│  [ ] All new public functions/classes have JSDoc comments       │
│  [ ] All new files have a top-of-file comment explaining purpose│
│  [ ] Error paths are handled (no empty catch blocks)            │
│  [ ] No secrets or tokens in the diff                           │
└─────────────────────────────────────────────────────────────────┘
```

And before opening a **PR**:

```
┌─────────────────────────────────────────────────────────────────┐
│  PRE-PR QUALITY GATE (in addition to pre-commit above)          │
├─────────────────────────────────────────────────────────────────┤
│  [ ] npm run test:unit → all pass                               │
│  [ ] npm run compile → exit 0                                   │
│  [ ] All acceptance criteria from task card are met             │
│  [ ] PR description filled out completely (§6.3 template)       │
│  [ ] TASKS.md updated                                           │
│  [ ] CONTEXT.md updated                                         │
│  [ ] Branch rebased onto latest main                            │
│  [ ] No unrelated file changes in the diff                      │
│  [ ] New code has tests                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. Emergency Protocol

### 11.1 "I accidentally committed to main"

```bash
# Immediately create a new branch from current main to preserve your work
git checkout -b fix/accidental-main-commit

# Reset main to the last known good commit
git checkout main
git reset --hard HEAD~<number of accidental commits>
git push --force-with-lease origin main  # Only if main is not yet pushed — check first

# If already pushed to remote: raise it with a human immediately.
# Do not force-push to main without human approval.
```

### 11.2 "I ran a destructive git command in the extension and it corrupted the user's repo"

```
This should not be possible — the OperationExecutor requires confirmed: true.
If it happened:
1. Document exactly what happened in BUGS.md as P0
2. Add a regression test that would have caught it
3. Do NOT ship any fix without that regression test
```

### 11.3 "CI is broken on main (not my fault)"

1. Do not merge your PR while CI is broken on `main`.
2. File a P1 bug in BUGS.md.
3. Comment on any open PRs: "CI broken on main — do not merge".
4. Identify the commit that broke it (`git bisect` if needed).
5. Open a `fix/ci/<slug>` branch off the last green commit, fix, PR.

### 11.4 "I need to revert a merged PR"

```bash
# Identify the merge commit hash
git log --oneline main | head -20

# Create a revert branch
git checkout -b revert/<original-pr-slug>
git revert <merge-commit-hash> --mainline 1

# Open a PR with title: "[Revert] [M<n>] <original PR title>"
# PR description must explain WHY it's being reverted
```

### 11.5 "I'm stuck and don't know how to proceed"

1. Re-read the task card acceptance criteria — are they more specific than you thought?
2. Re-read TECH_DOCS.md §5 for the relevant subsystem.
3. Check DECISIONS.md — has this decision already been made?
4. Check `git log --oneline` — is there existing code you missed?
5. Write down exactly what you're stuck on in CONTEXT.md under "Known Issues".
6. Push your current branch state with a `wip:` commit.
7. Stop — leave the context well-documented for the next session.

---

## 12. Quick-Reference Checklists

### Starting a Task
```
git checkout main && git pull origin main
git checkout -b <branch-from-task-card>
# Read the files listed in the task card
# Read TECH_DOCS.md §5 for the subsystem
# Start coding
```

### Before Every Commit
```
npm run check-types   # must exit 0
npm run lint          # must exit 0
# Review diff: no magic strings, no any, no console.log
git add -p            # stage intentionally, not with git add .
git commit -m "feat(scope): description"
```

### Opening a PR
```
npm run test:unit     # must pass
npm run compile       # must exit 0
git rebase origin/main
git push origin <branch>
# Fill out PR description template (§6.3)
# Update TASKS.md + CONTEXT.md
gh pr create --title "[M<n>] feat(scope): description" --body-file .agent/pr-template.md
```

### When You Find an Out-of-Scope Bug
```
# 1. Don't fix it
# 2. Add to .agent/BUGS.md
# 3. Add TODO(M<n>) comment at the affected line
# 4. Add to CONTEXT.md Known Issues
# 5. Mention in PR description
# 6. Continue your task
```

### Ending a Session
```
# Update TASKS.md — check off completed criteria
# Update CONTEXT.md — Last Updated, state, known issues
# Update DECISIONS.md — any new ADRs
# git push origin <branch>
# Open or update PR
```

---

*This document is maintained by humans and agents collaboratively. If a rule is unclear or creates an unworkable situation, raise it — don't silently ignore it.*

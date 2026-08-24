#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# create-fixture-repo.sh
# Creates a deterministic mock Git repository for integration & unit testing.
# Includes:
#   - Root commit (initial)
#   - Linear commit chain
#   - Feature branches (feature/auth, feature/payment)
#   - 2-parent merge commit
#   - 3-parent octopus merge
#   - Tags (v0.1.0, v1.0.0)
#   - Stash entries
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

TARGET_DIR="${1:-./test-fixtures/sample-repo}"

rm -rf "$TARGET_DIR"
mkdir -p "$TARGET_DIR"
cd "$TARGET_DIR"

git init -b main

# Set deterministic author & committer info
export GIT_AUTHOR_NAME="Test Author"
export GIT_AUTHOR_EMAIL="author@example.com"
export GIT_COMMITTER_NAME="Test Committer"
export GIT_COMMITTER_EMAIL="committer@example.com"

# Fixed timestamps for reproducibility
COMMIT_DATE_BASE=1700000000

commit_at() {
  local offset="$1"
  local msg="$2"
  export GIT_AUTHOR_DATE="$((COMMIT_DATE_BASE + offset)) +0000"
  export GIT_COMMITTER_DATE="$((COMMIT_DATE_BASE + offset)) +0000"
  git commit -m "$msg"
}

# 1. Root commit
echo "# Sample Repo" > README.md
git add README.md
commit_at 100 "chore: initial commit (root)"
git tag v0.1.0

# 2. Second linear commit
echo "console.log('init');" > index.js
git add index.js
commit_at 200 "feat: add entry point"

# 3. Branch: feature/auth
git checkout -b feature/auth
echo "export const login = () => true;" > auth.js
git add auth.js
commit_at 300 "feat(auth): implement login"

# 4. Branch: feature/payment from main
git checkout main
git checkout -b feature/payment
echo "export const pay = () => 100;" > payment.js
git add payment.js
commit_at 400 "feat(payment): implement checkout"

# 5. Advance main
git checkout main
echo "// main branch update" >> README.md
git add README.md
commit_at 500 "docs: update readme on main"

# 6. Merge feature/auth into main (2-parent merge)
git merge feature/auth -m "merge: merge feature/auth into main"
git tag v1.0.0

# 7. Create branches for octopus merge
git checkout main
echo "// octopus prep" >> README.md
git add README.md && commit_at 550 "docs: octopus prep"

git checkout -b octo/branch-a
echo "module_a" > a.txt && git add a.txt && commit_at 600 "feat: branch a"

git checkout main
git checkout -b octo/branch-b
echo "module_b" > b.txt && git add b.txt && commit_at 700 "feat: branch b"

# Merge both into main via octopus merge (3 parents: main, octo/branch-a, octo/branch-b)
git checkout main
git merge octo/branch-a octo/branch-b --no-ff -m "merge: octopus merge branch-a and branch-b"

# 8. Create a stash
echo "wip changes" >> README.md
git stash push -m "WIP on docs update"

echo "✅ Test fixture repo successfully created at $TARGET_DIR"

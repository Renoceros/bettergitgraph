import type { SimpleGit } from 'simple-git';
import * as path from 'path';
import * as fs from 'fs';

// ─── Git Operation Types ───────────────────────────────────────────────────────

export type GitOperation =
  | { op: 'CHECKOUT'; hash?: string; branch?: string }
  | { op: 'RESET'; mode: 'soft' | 'mixed' | 'hard'; hash: string; confirmed?: boolean }
  | { op: 'REVERT'; hash: string }
  | { op: 'CHERRY_PICK'; hash: string }
  | { op: 'CREATE_BRANCH'; name: string; hash: string }
  | { op: 'DELETE_BRANCH'; name: string; force?: boolean; confirmed?: boolean }
  | { op: 'MERGE'; branch: string; strategy?: 'ff' | 'no-ff' | 'squash' }
  | { op: 'REBASE'; branch: string }
  | { op: 'TAG'; name: string; hash: string; message?: string }
  | { op: 'PUSH'; branch?: string; remote?: string; force?: boolean; confirmed?: boolean }
  | { op: 'PULL'; branch?: string; remote?: string }
  | { op: 'STAGE_FILE'; file: string }
  | { op: 'UNSTAGE_FILE'; file: string }
  | { op: 'STAGE_ALL' }
  | { op: 'UNSTAGE_ALL' }
  | { op: 'DISCARD_FILE'; file: string; confirmed?: boolean }
  | { op: 'COMMIT'; message: string; push?: boolean }
  | { op: 'COMMIT_AMEND'; message?: string }
  | { op: 'STASH_SAVE'; message?: string }
  | { op: 'STASH_POP'; index: number }
  | { op: 'STASH_APPLY'; index: number }
  | { op: 'STASH_DROP'; index: number; confirmed?: boolean };

export interface OperationResult {
  success: boolean;
  message: string;
  commandRun: string;
  error?: string;
}

export interface OperationLogEntry {
  id: string;
  timestamp: string;
  operation: GitOperation;
  result: OperationResult;
}

// ─── Security Validation Helpers ──────────────────────────────────────────────

function isValidRefName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  // Disallow leading dashes (prevents git flag injection), null bytes, newlines, and control chars
  if (trimmed.startsWith('-') || /[\x00-\x1f\x7f\s~^:?*\[\\]/.test(trimmed)) {
    return false;
  }
  return trimmed.length > 0 && trimmed.length <= 255;
}

function isValidHash(hash: string): boolean {
  if (!hash || typeof hash !== 'string') return false;
  const trimmed = hash.trim();
  // Valid commit SHA (7 to 40 hex chars) or standard ref
  if (trimmed.startsWith('-') || /[\x00-\x1f\x7f\s]/.test(trimmed)) {
    return false;
  }
  return /^[0-9a-fA-F]{4,40}$/.test(trimmed) || isValidRefName(trimmed);
}

// ─── GitOperationExecutor ─────────────────────────────────────────────────────

export class GitOperationExecutor {
  private readonly logPath: string;

  constructor(
    private readonly git: SimpleGit,
    private readonly repoRoot: string
  ) {
    this.logPath = path.join(this.repoRoot, '.git', 'bettergitgraph-op-log.json');
  }

  async execute(op: GitOperation): Promise<OperationResult> {
    let result: OperationResult;

    try {
      switch (op.op) {
        case 'CHECKOUT': {
          const target = op.branch || op.hash;
          if (!target || (!isValidHash(target) && !isValidRefName(target))) {
            throw new Error('Valid target branch or commit hash required for checkout.');
          }
          await this.git.checkout(target);
          result = {
            success: true,
            message: `Checked out ${target}`,
            commandRun: `git checkout ${target}`,
          };
          break;
        }

        case 'RESET': {
          if (!isValidHash(op.hash)) {
            throw new Error('Invalid commit hash for reset.');
          }
          if (op.mode === 'hard' && !op.confirmed) {
            return {
              success: false,
              message: 'Confirmation required for destructive hard reset.',
              commandRun: `git reset --hard ${op.hash}`,
              error: 'CONFIRMATION_REQUIRED',
            };
          }
          const flag = `--${op.mode}`;
          await this.git.reset([flag as '--soft' | '--mixed' | '--hard', op.hash]);
          result = {
            success: true,
            message: `Reset branch to ${op.hash.slice(0, 8)} (${op.mode})`,
            commandRun: `git reset ${flag} ${op.hash}`,
          };
          break;
        }

        case 'REVERT': {
          if (!isValidHash(op.hash)) {
            throw new Error('Invalid commit hash for revert.');
          }
          await this.git.revert(op.hash);
          result = {
            success: true,
            message: `Reverted commit ${op.hash.slice(0, 8)}`,
            commandRun: `git revert ${op.hash}`,
          };
          break;
        }

        case 'CHERRY_PICK': {
          if (!isValidHash(op.hash)) {
            throw new Error('Invalid commit hash for cherry-pick.');
          }
          await this.git.raw(['cherry-pick', op.hash]);
          result = {
            success: true,
            message: `Cherry-picked commit ${op.hash.slice(0, 8)}`,
            commandRun: `git cherry-pick ${op.hash}`,
          };
          break;
        }

        case 'CREATE_BRANCH': {
          if (!isValidRefName(op.name)) {
            throw new Error(`Invalid branch name '${op.name}'.`);
          }
          if (!isValidHash(op.hash)) {
            throw new Error('Invalid commit hash for branch base.');
          }
          await this.git.branch([op.name, op.hash]);
          result = {
            success: true,
            message: `Created branch '${op.name}' at ${op.hash.slice(0, 8)}`,
            commandRun: `git branch ${op.name} ${op.hash}`,
          };
          break;
        }

        case 'DELETE_BRANCH': {
          if (!isValidRefName(op.name)) {
            throw new Error(`Invalid branch name '${op.name}'.`);
          }
          if (op.force && !op.confirmed) {
            return {
              success: false,
              message: 'Confirmation required for force deleting branch.',
              commandRun: `git branch -D ${op.name}`,
              error: 'CONFIRMATION_REQUIRED',
            };
          }
          const deleteFlag = op.force ? '-D' : '-d';
          await this.git.branch([deleteFlag, op.name]);
          result = {
            success: true,
            message: `Deleted branch '${op.name}'`,
            commandRun: `git branch ${deleteFlag} ${op.name}`,
          };
          break;
        }

        case 'MERGE': {
          if (!isValidRefName(op.branch)) {
            throw new Error(`Invalid branch name '${op.branch}'.`);
          }
          const args = [op.branch];
          if (op.strategy === 'no-ff') args.push('--no-ff');
          if (op.strategy === 'squash') args.push('--squash');
          await this.git.merge(args);
          result = {
            success: true,
            message: `Merged '${op.branch}' into current branch`,
            commandRun: `git merge ${args.join(' ')}`,
          };
          break;
        }

        case 'REBASE': {
          if (!isValidRefName(op.branch)) {
            throw new Error(`Invalid branch name '${op.branch}'.`);
          }
          await this.git.rebase([op.branch]);
          result = {
            success: true,
            message: `Rebased current branch onto '${op.branch}'`,
            commandRun: `git rebase ${op.branch}`,
          };
          break;
        }

        case 'TAG': {
          if (!isValidRefName(op.name)) {
            throw new Error(`Invalid tag name '${op.name}'.`);
          }
          if (!isValidHash(op.hash)) {
            throw new Error('Invalid commit hash for tag.');
          }
          if (op.message) {
            await this.git.addAnnotatedTag(op.name, op.message);
          } else {
            await this.git.tag([op.name, op.hash]);
          }
          result = {
            success: true,
            message: `Tagged ${op.hash.slice(0, 8)} as '${op.name}'`,
            commandRun: `git tag ${op.name} ${op.hash}`,
          };
          break;
        }

        case 'PUSH': {
          const remote = op.remote || 'origin';
          const args: string[] = [];
          if (op.force) {
            if (!op.confirmed) {
              return {
                success: false,
                message: 'Confirmation required for destructive force push.',
                commandRun: `git push --force-with-lease ${remote} ${op.branch ?? ''}`.trim(),
                error: 'CONFIRMATION_REQUIRED',
              };
            }
            args.push('--force-with-lease');
          }
          args.push(remote);
          if (op.branch) args.push(op.branch);

          await this.git.push(args);
          result = {
            success: true,
            message: `Pushed changes to ${remote}${op.branch ? ` (${op.branch})` : ''}`,
            commandRun: `git push ${args.join(' ')}`.trim(),
          };
          break;
        }

        case 'PULL': {
          const remote = op.remote || 'origin';
          await this.git.pull(remote, op.branch, ['--ff-only']);
          result = {
            success: true,
            message: `Pulled latest changes from ${remote}`,
            commandRun: `git pull ${remote} ${op.branch ?? ''} --ff-only`.trim(),
          };
          break;
        }

        case 'STAGE_FILE': {
          if (!op.file) throw new Error('File path required for staging.');
          await this.git.add(op.file);
          result = {
            success: true,
            message: `Staged ${op.file}`,
            commandRun: `git add ${op.file}`,
          };
          break;
        }

        case 'UNSTAGE_FILE': {
          if (!op.file) throw new Error('File path required for unstaging.');
          await this.git.raw(['restore', '--staged', op.file]);
          result = {
            success: true,
            message: `Unstaged ${op.file}`,
            commandRun: `git restore --staged ${op.file}`,
          };
          break;
        }

        case 'STAGE_ALL': {
          await this.git.add('-A');
          result = {
            success: true,
            message: 'Staged all working changes',
            commandRun: 'git add -A',
          };
          break;
        }

        case 'UNSTAGE_ALL': {
          await this.git.raw(['restore', '--staged', '.']);
          result = {
            success: true,
            message: 'Unstaged all changes',
            commandRun: 'git restore --staged .',
          };
          break;
        }

        case 'DISCARD_FILE': {
          if (!op.file) throw new Error('File path required for discarding.');
          if (!op.confirmed) {
            return {
              success: false,
              message: `Confirmation required to discard changes in ${op.file}.`,
              commandRun: `git restore ${op.file}`,
              error: 'CONFIRMATION_REQUIRED',
            };
          }
          try {
            await this.git.raw(['restore', op.file]);
          } catch {
            await this.git.raw(['clean', '-f', op.file]);
          }
          result = {
            success: true,
            message: `Discarded working changes in ${op.file}`,
            commandRun: `git restore ${op.file}`,
          };
          break;
        }

        case 'COMMIT': {
          if (!op.message || !op.message.trim()) {
            throw new Error('Commit message cannot be empty.');
          }
          await this.git.commit(op.message.trim());
          if (op.push) {
            await this.git.push();
          }
          result = {
            success: true,
            message: op.push ? 'Committed and pushed changes' : 'Committed working changes',
            commandRun: `git commit -m "${op.message.trim()}"${op.push ? ' && git push' : ''}`,
          };
          break;
        }

        case 'COMMIT_AMEND': {
          const args = ['commit', '--amend', '--no-edit'];
          if (op.message && op.message.trim()) {
            args.length = 0;
            args.push('commit', '--amend', '-m', op.message.trim());
          }
          await this.git.raw(args);
          result = {
            success: true,
            message: 'Amended previous commit',
            commandRun: `git ${args.join(' ')}`,
          };
          break;
        }

        case 'STASH_SAVE': {
          const msg = op.message ? ['push', '-m', op.message] : ['push'];
          await this.git.stash(msg);
          result = {
            success: true,
            message: op.message ? `Saved stash: ${op.message}` : 'Saved working changes to stash',
            commandRun: `git stash ${msg.join(' ')}`,
          };
          break;
        }

        case 'STASH_POP': {
          const stashRef = `stash@{${op.index}}`;
          await this.git.stash(['pop', stashRef]);
          result = {
            success: true,
            message: `Popped stash ${stashRef}`,
            commandRun: `git stash pop ${stashRef}`,
          };
          break;
        }

        case 'STASH_APPLY': {
          const stashRef = `stash@{${op.index}}`;
          await this.git.stash(['apply', stashRef]);
          result = {
            success: true,
            message: `Applied stash ${stashRef}`,
            commandRun: `git stash apply ${stashRef}`,
          };
          break;
        }

        case 'STASH_DROP': {
          const stashRef = `stash@{${op.index}}`;
          if (!op.confirmed) {
            return {
              success: false,
              message: `Confirmation required to drop ${stashRef}.`,
              commandRun: `git stash drop ${stashRef}`,
              error: 'CONFIRMATION_REQUIRED',
            };
          }
          await this.git.stash(['drop', stashRef]);
          result = {
            success: true,
            message: `Dropped stash ${stashRef}`,
            commandRun: `git stash drop ${stashRef}`,
          };
          break;
        }

        default:
          result = {
            success: false,
            message: 'Unknown git operation',
            commandRun: '',
            error: 'UNKNOWN_OPERATION',
          };
      }
    } catch (err) {
      result = {
        success: false,
        message: `Failed to execute operation: ${String(err)}`,
        commandRun: '',
        error: String(err),
      };
    }

    this.logOperation(op, result);
    return result;
  }

  private logOperation(operation: GitOperation, result: OperationResult): void {
    try {
      const entry: OperationLogEntry = {
        id: Math.random().toString(36).slice(2, 9),
        timestamp: new Date().toISOString(),
        operation,
        result,
      };

      let logs: OperationLogEntry[] = [];
      if (fs.existsSync(this.logPath)) {
        const raw = fs.readFileSync(this.logPath, 'utf8');
        logs = JSON.parse(raw);
      }
      logs.unshift(entry);
      // Keep last 100 entries
      if (logs.length > 100) logs = logs.slice(0, 100);

      fs.writeFileSync(this.logPath, JSON.stringify(logs, null, 2), 'utf8');
    } catch {
      // Non-critical logging failure
    }
  }

  getOperationLogs(): OperationLogEntry[] {
    try {
      if (fs.existsSync(this.logPath)) {
        return JSON.parse(fs.readFileSync(this.logPath, 'utf8'));
      }
    } catch {
      // Ignored
    }
    return [];
  }
}

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
  | { op: 'PUSH'; branch?: string; remote?: string }
  | { op: 'PULL'; branch?: string; remote?: string };

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
          if (!target) throw new Error('Target branch or commit hash required for checkout.');
          await this.git.checkout(target);
          result = {
            success: true,
            message: `Checked out ${target}`,
            commandRun: `git checkout ${target}`,
          };
          break;
        }

        case 'RESET': {
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
          await this.git.revert(op.hash);
          result = {
            success: true,
            message: `Reverted commit ${op.hash.slice(0, 8)}`,
            commandRun: `git revert ${op.hash}`,
          };
          break;
        }

        case 'CHERRY_PICK': {
          await this.git.raw(['cherry-pick', op.hash]);
          result = {
            success: true,
            message: `Cherry-picked commit ${op.hash.slice(0, 8)}`,
            commandRun: `git cherry-pick ${op.hash}`,
          };
          break;
        }

        case 'CREATE_BRANCH': {
          await this.git.branch([op.name, op.hash]);
          result = {
            success: true,
            message: `Created branch '${op.name}' at ${op.hash.slice(0, 8)}`,
            commandRun: `git branch ${op.name} ${op.hash}`,
          };
          break;
        }

        case 'DELETE_BRANCH': {
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
          await this.git.rebase([op.branch]);
          result = {
            success: true,
            message: `Rebased current branch onto '${op.branch}'`,
            commandRun: `git rebase ${op.branch}`,
          };
          break;
        }

        case 'TAG': {
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
          if (op.branch) {
            await this.git.push(remote, op.branch);
          } else {
            await this.git.push();
          }
          result = {
            success: true,
            message: `Pushed changes to ${remote}`,
            commandRun: `git push ${remote} ${op.branch ?? ''}`.trim(),
          };
          break;
        }

        case 'PULL': {
          const remote = op.remote || 'origin';
          await this.git.pull(remote, op.branch);
          result = {
            success: true,
            message: `Pulled latest changes from ${remote}`,
            commandRun: `git pull ${remote} ${op.branch ?? ''}`.trim(),
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

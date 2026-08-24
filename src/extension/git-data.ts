import type { SimpleGit } from 'simple-git';

// ─── Public Types ─────────────────────────────────────────────────────────────

export interface CommitNode {
  /** Full 40-char SHA */
  hash: string;
  /** First 8 chars */
  shortHash: string;
  subject: string;
  author: string;
  authorEmail: string;
  date: Date;
  /** Parent hashes: [] = root commit, [x] = normal, [x,y] = merge, [x,y,z...] = octopus */
  parents: string[];
  /** Ref names pointing at this commit (e.g. "HEAD -> main", "origin/main", "v1.0.0") */
  refs: string[];
}

export interface BranchInfo {
  name: string;
  isRemote: boolean;
  isHead: boolean;
  upstream?: string | undefined;
  aheadCount: number;
  behindCount: number;
  headHash: string;
}

export interface TagInfo {
  name: string;
  hash: string;
  date?: Date | undefined;
}

export interface StashInfo {
  index: number;
  message: string;
  hash: string;
}

export interface ChangedFile {
  path: string;
  status: 'M' | 'A' | 'D' | 'R' | 'C' | '?';
}

export interface FetchResult {
  success: boolean;
  summary: string;
  error?: string;
}

// ─── GitDataLayer ─────────────────────────────────────────────────────────────

/**
 * Thin wrapper around simple-git that parses git output into typed structures.
 * All methods are async and safe to call concurrently.
 */
export class GitDataLayer {
  constructor(
    public readonly git: SimpleGit,
    public readonly repoRoot: string
  ) {}

  /**
   * Returns all commits reachable from all refs, deduplicated.
   * Uses unit separator (\x1f) delimiter so commit subjects containing pipes or special chars don't corrupt columns.
   */
  async getCommitGraph(options?: {
    maxCount?: number;
    since?: Date;
    authors?: string[];
  }): Promise<{ commits: CommitNode[]; edges: [string, string][] }> {
    const maxCount = options?.maxCount ?? 2000;
    const DELIM = '%x1f';
    const format = `%H${DELIM}%P${DELIM}%s${DELIM}%an${DELIM}%ae${DELIM}%aI${DELIM}%D`;

    const args: string[] = [
      'log',
      '--all',
      '--topo-order',
      `-n`,
      `${maxCount}`,
      `--format=${format}`,
    ];

    if (options?.since) {
      args.push(`--since=${options.since.toISOString()}`);
    }
    if (options?.authors?.length) {
      for (const a of options.authors) {
        args.push(`--author=${a}`);
      }
    }

    let rawLog: string;
    try {
      rawLog = await this.git.raw(args);
    } catch {
      // Empty repo or no commits
      return { commits: [], edges: [] };
    }

    const lines = rawLog.split('\n').filter((l) => l.trim().length > 0);
    const commits: CommitNode[] = [];
    const edges: [string, string][] = [];

    for (const line of lines) {
      const parts = line.split('\x1f');
      if (parts.length < 6) continue;

      const hash = parts[0]?.trim();
      if (!hash) continue;

      const parentsRaw = parts[1]?.trim() ?? '';
      const subject = parts[2]?.trim() ?? '';
      const author = parts[3]?.trim() ?? '';
      const authorEmail = parts[4]?.trim() ?? '';
      const dateRaw = parts[5]?.trim() ?? '';
      const refsRaw = parts[6]?.trim() ?? '';

      const parents = parentsRaw.length > 0 ? parentsRaw.split(' ').filter(Boolean) : [];
      const refs = refsRaw.length > 0
        ? refsRaw
            .split(',')
            .map((r) => r.trim())
            .filter(Boolean)
        : [];

      commits.push({
        hash,
        shortHash: hash.slice(0, 8),
        subject,
        author,
        authorEmail,
        date: dateRaw ? new Date(dateRaw) : new Date(),
        parents,
        refs,
      });

      for (const parent of parents) {
        edges.push([hash, parent]);
      }
    }

    return { commits, edges };
  }

  /** Returns all local + remote branches with tracking metadata */
  async getAllBranches(): Promise<BranchInfo[]> {
    try {
      const raw = await this.git.raw([
        'branch',
        '-a',
        '--format=%(refname:short)|%(objectname)|%(upstream:short)|%(upstream:track)|%(HEAD)',
      ]);

      const branches: BranchInfo[] = [];
      const lines = raw.split('\n').filter((l) => l.trim().length > 0);

      for (const line of lines) {
        const [name, headHash, upstream, trackingInfo, headMarker] = line.split('|');
        if (!name) continue;

        const cleanName = name.trim().replace(/^remotes\//, '');
        const isRemote = name.trim().startsWith('remotes/') || cleanName.startsWith('origin/');
        const isHead = headMarker?.trim() === '*';
        const aheadMatch = /ahead (\d+)/.exec(trackingInfo ?? '');
        const behindMatch = /behind (\d+)/.exec(trackingInfo ?? '');

        branches.push({
          name: cleanName,
          isRemote,
          isHead,
          upstream: upstream?.trim() || undefined,
          headHash: headHash?.trim() ?? '',
          aheadCount: aheadMatch ? parseInt(aheadMatch[1] ?? '0', 10) : 0,
          behindCount: behindMatch ? parseInt(behindMatch[1] ?? '0', 10) : 0,
        });
      }

      return branches;
    } catch {
      return [];
    }
  }

  /** Returns all tags */
  async getTags(): Promise<TagInfo[]> {
    try {
      const raw = await this.git.raw(['tag', '-l', '--format=%(refname:short)|%(objectname)|%(creatordate:iso-strict)']);
      if (!raw.trim()) return [];

      return raw
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .map((line) => {
          const [name, hash, dateStr] = line.split('|');
          return {
            name: name?.trim() ?? '',
            hash: hash?.trim() ?? '',
            date: dateStr?.trim() ? new Date(dateStr.trim()) : undefined,
          };
        });
    } catch {
      return [];
    }
  }

  /** Returns stash list */
  async getStashes(): Promise<StashInfo[]> {
    try {
      const raw = await this.git.stashList();
      return (raw.all ?? []).map((s, i) => ({
        index: i,
        message: s.message,
        hash: s.hash,
      }));
    } catch {
      return [];
    }
  }

  /** git fetch --all --prune */
  async fetchAll(): Promise<FetchResult> {
    try {
      const result = await this.git.fetch(['--all', '--prune']);
      return { success: true, summary: typeof result === 'string' ? result : JSON.stringify(result) };
    } catch (err) {
      return { success: false, summary: '', error: String(err) };
    }
  }

  /**
   * Files changed in a specific commit.
   * Handles root commits safely via `diff-tree --root --no-commit-id -r`.
   */
  async getCommitFiles(hash: string): Promise<ChangedFile[]> {
    try {
      const diff = await this.git.raw([
        'diff-tree',
        '--root',
        '--no-commit-id',
        '--name-status',
        '-r',
        hash,
      ]);

      return diff
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const [status, ...pathParts] = line.split(/\s+/);
          return {
            status: (status?.charAt(0) ?? '?') as ChangedFile['status'],
            path: pathParts.join(' ').trim(),
          };
        });
    } catch {
      return [];
    }
  }

  /**
   * Unified diff for a file at a commit.
   * Handles root commits (diff against empty tree) cleanly.
   */
  async getFileDiff(hash: string, filePath: string): Promise<string> {
    try {
      return await this.git.raw(['show', '--format=', hash, '--', filePath]);
    } catch {
      return '';
    }
  }
}

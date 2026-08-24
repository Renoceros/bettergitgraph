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
  /** Parent hashes: [] = root commit, [x] = normal, [x,y] = merge */
  parents: string[];
  /** Ref names pointing at this commit (e.g. "HEAD -> main", "origin/main", "v1.0.0") */
  refs: string[];
}

export interface BranchInfo {
  name: string;
  isRemote: boolean;
  isHead: boolean;
  upstream?: string;
  aheadCount: number;
  behindCount: number;
  headHash: string;
}

export interface TagInfo {
  name: string;
  hash: string;
  date?: Date;
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
    private readonly git: SimpleGit,
    private readonly repoRoot: string
  ) {}

  /**
   * Returns all commits reachable from all refs, deduplicated.
   * Uses topo-order so branch structure is preserved.
   */
  async getCommitGraph(options?: {
    maxCount?: number;
    since?: Date;
    authors?: string[];
  }): Promise<{ commits: CommitNode[]; edges: [string, string][] }> {
    const maxCount = options?.maxCount ?? 2000;
    const args: string[] = [
      '--all',
      '--topo-order',
      `--max-count=${maxCount}`,
      '--format=%H|%P|%s|%an|%ae|%aI|%D',
    ];

    if (options?.since) {
      args.push(`--since=${options.since.toISOString()}`);
    }
    if (options?.authors?.length) {
      for (const a of options.authors) {
        args.push(`--author=${a}`);
      }
    }

    const raw = await this.git.log(args as Parameters<SimpleGit['log']>[0]);
    const commits: CommitNode[] = [];
    const edges: [string, string][] = [];

    for (const line of (raw as unknown as { all: string[] }).all ?? []) {
      const [hash, parentsRaw, subject, author, authorEmail, dateRaw, refsRaw] =
        line.split('|');
      if (!hash) continue;

      const parents = parentsRaw ? parentsRaw.trim().split(' ').filter(Boolean) : [];
      const refs = refsRaw
        ? refsRaw
            .split(',')
            .map((r) => r.trim())
            .filter(Boolean)
        : [];

      commits.push({
        hash: hash.trim(),
        shortHash: hash.trim().slice(0, 8),
        subject: subject ?? '',
        author: author ?? '',
        authorEmail: authorEmail ?? '',
        date: new Date(dateRaw ?? ''),
        parents,
        refs,
      });

      for (const parent of parents) {
        edges.push([hash.trim(), parent]);
      }
    }

    return { commits, edges };
  }

  /** Returns all local + remote branches with tracking metadata */
  async getAllBranches(): Promise<BranchInfo[]> {
    const summary = await this.git.branch(['-avv', '--format=%(refname:short)|%(objectname:short)|%(upstream:short)|%(upstream:track)|%(HEAD)']);
    const branches: BranchInfo[] = [];

    for (const b of Object.values(summary.branches)) {
      const isRemote = b.name.startsWith('remotes/') || b.name.includes('/');
      const trackingInfo = b.label ?? '';
      const aheadMatch = /ahead (\d+)/.exec(trackingInfo);
      const behindMatch = /behind (\d+)/.exec(trackingInfo);

      branches.push({
        name: b.name,
        isRemote,
        isHead: b.current,
        headHash: b.commit,
        aheadCount: aheadMatch ? parseInt(aheadMatch[1] ?? '0', 10) : 0,
        behindCount: behindMatch ? parseInt(behindMatch[1] ?? '0', 10) : 0,
      });
    }

    return branches;
  }

  /** Returns all tags */
  async getTags(): Promise<TagInfo[]> {
    const tags = await this.git.tags();
    return tags.all.map((name) => ({ name, hash: '' }));
  }

  /** Returns stash list */
  async getStashes(): Promise<StashInfo[]> {
    const raw = await this.git.stashList();
    return (raw.all ?? []).map((s, i) => ({
      index: i,
      message: s.message,
      hash: s.hash,
    }));
  }

  /** git fetch --all --prune */
  async fetchAll(): Promise<FetchResult> {
    try {
      const result = await this.git.fetch(['--all', '--prune']);
      return { success: true, summary: JSON.stringify(result) };
    } catch (err) {
      return { success: false, summary: '', error: String(err) };
    }
  }

  /** Files changed in a specific commit */
  async getCommitFiles(hash: string): Promise<ChangedFile[]> {
    const diff = await this.git.diff([`${hash}^`, hash, '--name-status']);
    return diff
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [status, ...pathParts] = line.split('\t');
        return {
          status: (status?.charAt(0) ?? '?') as ChangedFile['status'],
          path: pathParts.join('\t'),
        };
      });
  }

  /** Unified diff for a file at a commit */
  async getFileDiff(hash: string, filePath: string): Promise<string> {
    return this.git.diff([`${hash}^`, hash, '--', filePath]);
  }
}

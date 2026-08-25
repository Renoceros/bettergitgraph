import dagre from '@dagrejs/dagre';
import type { CommitNode, BranchInfo, WorkingTreeStatus } from '../../../extension/git-data';

// ─── Public Layout Types ───────────────────────────────────────────────────────

export type CommitNodeType =
  | 'initial'  // Root commit (no parents)
  | 'commit'   // Standard single-parent commit
  | 'merge'    // 2-parent merge commit
  | 'octopus'  // 3+ parent octopus merge
  | 'stash'    // Stash commit
  | 'pr'       // Pull Request / Merge Request node
  | 'issue'    // Issue closing / referencing node
  | 'wip';     // Working Tree (uncommitted changes) node

export type LayoutDirection = 'TB' | 'BT' | 'LR' | 'RL';
export type DateFormat = 'local' | 'relative' | 'iso';

export interface LayoutPlaque {
  x: number;
  y: number;
  width: number;
  height: number;
  placement: 'right' | 'top' | 'bottom' | 'left';
}

export interface LayoutNode {
  hash: string;
  shortHash: string;
  subject: string;
  author: string;
  authorEmail: string;
  date: Date;
  relativeTime: string;
  formattedDate: string;
  x: number;
  y: number;
  radius: number;
  nodeType: CommitNodeType;
  prNumber?: number;
  issueNumber?: number;
  isWip?: boolean;
  wipStagedCount?: number;
  wipUnstagedCount?: number;
  aheadCount?: number;
  behindCount?: number;
  branchName: string;
  branchColor: string;
  isHead: boolean;
  isMerge: boolean;
  isMainBranch: boolean;
  refs: string[];
  parents: string[];
  plaque: LayoutPlaque;
}

export interface LayoutEdge {
  source: string; // child commit hash
  target: string; // parent commit hash
  color: string;
  isMainEdge: boolean;
  points: { x: number; y: number }[];
}

export interface GraphLayout {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  nodeMap: Map<string, LayoutNode>;
  width: number;
  height: number;
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}

export interface LayoutOptions {
  direction?: LayoutDirection;
  viewMode?: 'topo' | 'temporal';
  dateFormat?: DateFormat;
  nodeRadius?: number;
  nodeSpacingX?: number;
  nodeSpacingY?: number;
  padding?: number;
  workingTreeStatus?: WorkingTreeStatus;
}

// ─── Date Formatting Helper ───────────────────────────────────────────────────

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 45) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return `${diffYear}y ago`;
}

export function formatCommitDate(date: Date, format: DateFormat = 'local'): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  if (format === 'relative') {
    return formatRelativeTime(d);
  }

  if (format === 'iso') {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // Local Time (e.g. "Aug 24, 19:45 GMT+8" or "19:45 GMT+8")
  try {
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    
    // Get GMT offset string
    const offsetMin = -d.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offsetMin) / 60);
    const offsetSign = offsetMin >= 0 ? '+' : '-';
    const gmtStr = `GMT${offsetSign}${offsetHours}`;

    return `${dateStr}, ${timeStr} (${gmtStr})`;
  } catch {
    return formatRelativeTime(d);
  }
}

/**
 * Classifies a commit into its visual node type (initial, merge, octopus, pr, issue, stash, wip, commit)
 * and extracts associated PR / Issue numbers if present.
 */
export function classifyCommitNode(commit: CommitNode): {
  nodeType: CommitNodeType;
  prNumber?: number;
  issueNumber?: number;
} {
  if (commit.hash === '__WIP__') {
    return { nodeType: 'wip' };
  }

  // 1. Pull Request patterns
  const prMatch =
    /Merge pull request #(\d+)/i.exec(commit.subject) ??
    /\(#(\d+)\)$/.exec(commit.subject) ??
    /Merge PR #(\d+)/i.exec(commit.subject);

  const prRefMatch = commit.refs.map((r) => /pull\/(\d+)/.exec(r)).find(Boolean);
  const prNum = prMatch ? parseInt(prMatch[1]!, 10) : prRefMatch ? parseInt(prRefMatch[1]!, 10) : undefined;

  // 2. Issue references
  const issueMatch = /(?:Fixes|Closes|Resolves|Refs|Issue)\s*#(\d+)/i.exec(commit.subject);
  const issueNum = issueMatch ? parseInt(issueMatch[1]!, 10) : undefined;

  if (commit.subject.startsWith('WIP on ')) {
    return { nodeType: 'stash' };
  }
  if (prNum !== undefined) {
    return { nodeType: 'pr', prNumber: prNum, issueNumber: issueNum };
  }
  if (commit.parents.length === 0) {
    return { nodeType: 'initial', issueNumber: issueNum };
  }
  if (commit.parents.length > 2) {
    return { nodeType: 'octopus', issueNumber: issueNum };
  }
  if (commit.parents.length === 2) {
    return { nodeType: 'merge', issueNumber: issueNum };
  }
  if (issueNum !== undefined) {
    return { nodeType: 'issue', issueNumber: issueNum };
  }

  return { nodeType: 'commit' };
}

// ─── DAGLayoutEngine ──────────────────────────────────────────────────────────

export class DAGLayoutEngine {
  private readonly defaultOptions: Required<LayoutOptions> = {
    direction: 'TB',
    viewMode: 'temporal',
    dateFormat: 'local',
    nodeRadius: 8,
    nodeSpacingX: 64,
    nodeSpacingY: 60,
    padding: 40,
    workingTreeStatus: { isDirty: false, staged: [], unstaged: [], untracked: [], conflicted: [] },
  };

  /**
   * Computes layout coordinates (x, y) for all commit nodes, edges, and plaques.
   */
  layout(
    commits: CommitNode[],
    branches: BranchInfo[] = [],
    colorMap: Map<string, string> = new Map(),
    options?: LayoutOptions
  ): GraphLayout {
    const opts: Required<LayoutOptions> = { ...this.defaultOptions, ...options };

    if (!commits || commits.length === 0) {
      return {
        nodes: [],
        edges: [],
        nodeMap: new Map(),
        width: 0,
        height: 0,
        bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
      };
    }

    const mainBranch =
      branches.find((b) => b.name === 'main' || b.name === 'master') ??
      branches.find((b) => b.isHead) ??
      branches[0];
    const mainBranchName = mainBranch?.name ?? 'main';

    const headBranch = branches.find((b) => b.isHead);
    const headCommitHash = headBranch?.headHash;

    let layoutCommits = commits;
    if (opts.workingTreeStatus?.isDirty) {
      const targetHeadHash = headCommitHash || commits[0]?.hash;
      const stagedCount = opts.workingTreeStatus.staged.length;
      const unstagedCount = opts.workingTreeStatus.unstaged.length + opts.workingTreeStatus.untracked.length;
      const wipCommit: CommitNode = {
        hash: '__WIP__',
        shortHash: 'WIP',
        subject: `Uncommitted Changes (${stagedCount} staged, ${unstagedCount} unstaged)`,
        author: 'Working Directory',
        authorEmail: '',
        date: new Date(Date.now() + 60000), // ensure chronologically at very top
        parents: targetHeadHash ? [targetHeadHash] : [],
        refs: ['Working Tree'],
      };
      layoutCommits = [wipCommit, ...commits];
    }

    const commitBranchMap = this.assignCommitBranches(layoutCommits, branches, mainBranchName);

    if (opts.viewMode === 'temporal') {
      return this.layoutTemporal(layoutCommits, branches, commitBranchMap, colorMap, mainBranchName, headCommitHash, opts);
    }

    return this.layoutTopo(layoutCommits, branches, commitBranchMap, colorMap, mainBranchName, headCommitHash, opts);
  }

  /**
   * Topological DAG Layout (Structure view via Dagre)
   */
  private layoutTopo(
    commits: CommitNode[],
    branches: BranchInfo[],
    commitBranchMap: Map<string, string>,
    colorMap: Map<string, string>,
    mainBranchName: string,
    headCommitHash: string | undefined,
    opts: Required<LayoutOptions>
  ): GraphLayout {
    // Map direction to Dagre rankdir (BT/RL mapped via TB/LR then inverted)
    const dagreRankdir = opts.direction === 'LR' || opts.direction === 'RL' ? 'LR' : 'TB';

    const g = new dagre.graphlib.Graph({ multigraph: true });
    g.setGraph({
      rankdir: dagreRankdir,
      nodesep: opts.nodeSpacingX,
      ranksep: opts.nodeSpacingY,
      marginx: opts.padding,
      marginy: opts.padding,
      ranker: 'tight-tree',
    });
    g.setDefaultEdgeLabel(() => ({}));

    const nodeDiameter = opts.nodeRadius * 2;
    for (const commit of commits) {
      g.setNode(commit.hash, { width: nodeDiameter, height: nodeDiameter });
    }

    const commitSet = new Set(commits.map((c) => c.hash));
    for (const commit of commits) {
      for (const parentHash of commit.parents) {
        if (commitSet.has(parentHash)) {
          g.setEdge(commit.hash, parentHash, {}, `${commit.hash}->${parentHash}`);
        }
      }
    }

    dagre.layout(g);

    const layoutNodes: LayoutNode[] = [];
    const nodeMap = new Map<string, LayoutNode>();

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    // Determine graph bounding box from Dagre for inversion
    let rawMaxX = 0;
    let rawMaxY = 0;
    for (const commit of commits) {
      const dNode = g.node(commit.hash);
      if (dNode) {
        rawMaxX = Math.max(rawMaxX, dNode.x);
        rawMaxY = Math.max(rawMaxY, dNode.y);
      }
    }

    for (let i = 0; i < commits.length; i++) {
      const commit = commits[i]!;
      const dagreNode = g.node(commit.hash);
      let x = dagreNode?.x ?? opts.padding;
      let y = dagreNode?.y ?? opts.padding;

      // Handle BT / RL inversions
      if (opts.direction === 'BT') {
        y = rawMaxY - y + opts.padding;
      } else if (opts.direction === 'RL') {
        x = rawMaxX - x + opts.padding;
      }

      const branchName = commitBranchMap.get(commit.hash) ?? mainBranchName;
      const isMainBranch = branchName === mainBranchName || branchName.endsWith(`/${mainBranchName}`);
      const branchColor = colorMap.get(branchName) ?? (isMainBranch ? '#4ec9b0' : '#569cd6');

      const isHead = commit.hash === headCommitHash || commit.refs.some((r) => r.includes('HEAD'));
      const isMerge = commit.parents.length > 1;

      const classification = classifyCommitNode(commit);

      // Compute Adaptive Plaque Tag Card Geometry
      const plaqueWidth = 280;
      const plaqueHeight = 44;
      const plaque = this.computePlaqueGeometry(x, y, opts.nodeRadius, plaqueWidth, plaqueHeight, opts.direction, i);

      minX = Math.min(minX, x - opts.nodeRadius, plaque.x);
      minY = Math.min(minY, y - opts.nodeRadius, plaque.y);
      maxX = Math.max(maxX, x + opts.nodeRadius, plaque.x + plaque.width);
      maxY = Math.max(maxY, y + opts.nodeRadius, plaque.y + plaque.height);

      const isWip = commit.hash === '__WIP__';
      const branchObj = branches.find((b) => b.headHash === commit.hash);
      const aheadCount = branchObj?.aheadCount;
      const behindCount = branchObj?.behindCount;

      const layoutNode: LayoutNode = {
        hash: commit.hash,
        shortHash: commit.shortHash || commit.hash.slice(0, 8),
        subject: commit.subject,
        author: commit.author,
        authorEmail: commit.authorEmail,
        date: commit.date,
        relativeTime: formatRelativeTime(commit.date),
        formattedDate: formatCommitDate(commit.date, opts.dateFormat),
        x,
        y,
        radius: isWip || isMainBranch ? opts.nodeRadius + 1 : opts.nodeRadius,
        nodeType: classification.nodeType,
        prNumber: classification.prNumber,
        issueNumber: classification.issueNumber,
        isWip,
        wipStagedCount: isWip ? opts.workingTreeStatus?.staged.length : undefined,
        wipUnstagedCount: isWip ? (opts.workingTreeStatus?.unstaged.length ?? 0) + (opts.workingTreeStatus?.untracked.length ?? 0) : undefined,
        aheadCount,
        behindCount,
        branchName,
        branchColor: isWip ? '#4ec9b0' : branchColor,
        isHead: isWip ? true : isHead,
        isMerge,
        isMainBranch,
        refs: commit.refs,
        parents: commit.parents,
        plaque,
      };

      layoutNodes.push(layoutNode);
      nodeMap.set(commit.hash, layoutNode);
    }

    const layoutEdges: LayoutEdge[] = [];
    for (const edgeObj of g.edges()) {
      const sourceNode = nodeMap.get(edgeObj.v);
      const targetNode = nodeMap.get(edgeObj.w);

      if (!sourceNode || !targetNode) continue;

      const isMainEdge = sourceNode.isMainBranch && targetNode.isMainBranch;

      // Smooth spline points between transformed coordinates
      const midX = (sourceNode.x + targetNode.x) / 2;
      const midY = (sourceNode.y + targetNode.y) / 2;
      const points = [
        { x: sourceNode.x, y: sourceNode.y },
        { x: sourceNode.x, y: midY },
        { x: targetNode.x, y: midY },
        { x: targetNode.x, y: targetNode.y },
      ];

      layoutEdges.push({
        source: edgeObj.v,
        target: edgeObj.w,
        color: sourceNode.branchColor,
        isMainEdge,
        points,
      });
    }

    const width = maxX > minX ? maxX - minX + opts.padding * 2 : 800;
    const height = maxY > minY ? maxY - minY + opts.padding * 2 : 600;

    return {
      nodes: layoutNodes,
      edges: layoutEdges,
      nodeMap,
      width,
      height,
      bounds: { minX, minY, maxX, maxY },
    };
  }

  /**
   * Temporal Layout (Sequential Timeline View with 4-Direction Support)
   */
  private layoutTemporal(
    commits: CommitNode[],
    branches: BranchInfo[],
    commitBranchMap: Map<string, string>,
    colorMap: Map<string, string>,
    mainBranchName: string,
    headCommitHash: string | undefined,
    opts: Required<LayoutOptions>
  ): GraphLayout {
    // Sort commits strictly chronologically descending (newest first)
    const sortedCommits = [...commits].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Assign lane indexes (Main = Lane 0, features = Lane 1, 2, 3...)
    const laneMap = new Map<string, number>();
    laneMap.set(mainBranchName, 0);
    let nextLane = 1;

    for (const commit of sortedCommits) {
      const branch = commitBranchMap.get(commit.hash) ?? mainBranchName;
      if (!laneMap.has(branch)) {
        laneMap.set(branch, nextLane++);
      }
    }

    const layoutNodes: LayoutNode[] = [];
    const nodeMap = new Map<string, LayoutNode>();

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const isHorizontal = opts.direction === 'LR' || opts.direction === 'RL';

    for (let rowIndex = 0; rowIndex < sortedCommits.length; rowIndex++) {
      const commit = sortedCommits[rowIndex]!;
      const branchName = commitBranchMap.get(commit.hash) ?? mainBranchName;
      const isMainBranch = branchName === mainBranchName || branchName.endsWith(`/${mainBranchName}`);
      const branchColor = colorMap.get(branchName) ?? (isMainBranch ? '#4ec9b0' : '#569cd6');
      const laneIndex = laneMap.get(branchName) ?? 0;

      let x = 0;
      let y = 0;

      if (opts.direction === 'TB') {
        // Vertical: Time on Y, Lanes on X
        x = opts.padding + laneIndex * opts.nodeSpacingX;
        y = opts.padding + rowIndex * opts.nodeSpacingY;
      } else if (opts.direction === 'BT') {
        // Vertical Inverted: Oldest on Bottom, Newest on Top
        x = opts.padding + laneIndex * opts.nodeSpacingX;
        y = opts.padding + (sortedCommits.length - 1 - rowIndex) * opts.nodeSpacingY;
      } else if (opts.direction === 'LR') {
        // Horizontal: Time on X (newest on left -> oldest right), Lanes on Y
        x = opts.padding + rowIndex * opts.nodeSpacingX * 2.2;
        y = opts.padding + laneIndex * opts.nodeSpacingY * 1.5;
      } else if (opts.direction === 'RL') {
        // Horizontal Inverted: Time on X (oldest on left -> newest right), Lanes on Y
        x = opts.padding + (sortedCommits.length - 1 - rowIndex) * opts.nodeSpacingX * 2.2;
        y = opts.padding + laneIndex * opts.nodeSpacingY * 1.5;
      }

      const isHead = commit.hash === headCommitHash || commit.refs.some((r) => r.includes('HEAD'));
      const isMerge = commit.parents.length > 1;

      const classification = classifyCommitNode(commit);

      // Compute Adaptive Plaque Tag Card Geometry
      const plaqueWidth = 280;
      const plaqueHeight = 44;
      const plaque = this.computePlaqueGeometry(x, y, opts.nodeRadius, plaqueWidth, plaqueHeight, opts.direction, rowIndex);

      minX = Math.min(minX, x - opts.nodeRadius, plaque.x);
      minY = Math.min(minY, y - opts.nodeRadius, plaque.y);
      maxX = Math.max(maxX, x + opts.nodeRadius, plaque.x + plaque.width);
      maxY = Math.max(maxY, y + opts.nodeRadius, plaque.y + plaque.height);

      const isWip = commit.hash === '__WIP__';
      const branchObj = branches.find((b) => b.headHash === commit.hash);
      const aheadCount = branchObj?.aheadCount;
      const behindCount = branchObj?.behindCount;

      const layoutNode: LayoutNode = {
        hash: commit.hash,
        shortHash: commit.shortHash || commit.hash.slice(0, 8),
        subject: commit.subject,
        author: commit.author,
        authorEmail: commit.authorEmail,
        date: commit.date,
        relativeTime: formatRelativeTime(commit.date),
        formattedDate: formatCommitDate(commit.date, opts.dateFormat),
        x,
        y,
        radius: isWip || isMainBranch ? opts.nodeRadius + 1 : opts.nodeRadius,
        nodeType: classification.nodeType,
        prNumber: classification.prNumber,
        issueNumber: classification.issueNumber,
        isWip,
        wipStagedCount: isWip ? opts.workingTreeStatus?.staged.length : undefined,
        wipUnstagedCount: isWip ? (opts.workingTreeStatus?.unstaged.length ?? 0) + (opts.workingTreeStatus?.untracked.length ?? 0) : undefined,
        aheadCount,
        behindCount,
        branchName,
        branchColor: isWip ? '#4ec9b0' : branchColor,
        isHead: isWip ? true : isHead,
        isMerge,
        isMainBranch,
        refs: commit.refs,
        parents: commit.parents,
        plaque,
      };

      layoutNodes.push(layoutNode);
      nodeMap.set(commit.hash, layoutNode);
    }

    // Build edges
    const layoutEdges: LayoutEdge[] = [];
    for (const commit of sortedCommits) {
      const sourceNode = nodeMap.get(commit.hash);
      if (!sourceNode) continue;

      for (const parentHash of commit.parents) {
        const targetNode = nodeMap.get(parentHash);
        if (!targetNode) continue;

        const isMainEdge = sourceNode.isMainBranch && targetNode.isMainBranch;

        let points: { x: number; y: number }[];
        if (isHorizontal) {
          const midX = (sourceNode.x + targetNode.x) / 2;
          points = [
            { x: sourceNode.x, y: sourceNode.y },
            { x: midX, y: sourceNode.y },
            { x: midX, y: targetNode.y },
            { x: targetNode.x, y: targetNode.y },
          ];
        } else {
          const midY = (sourceNode.y + targetNode.y) / 2;
          points = [
            { x: sourceNode.x, y: sourceNode.y },
            { x: sourceNode.x, y: midY },
            { x: targetNode.x, y: midY },
            { x: targetNode.x, y: targetNode.y },
          ];
        }

        layoutEdges.push({
          source: sourceNode.hash,
          target: targetNode.hash,
          color: sourceNode.branchColor,
          isMainEdge,
          points,
        });
      }
    }

    const width = maxX > minX ? maxX - minX + opts.padding * 2 : 800;
    const height = maxY > minY ? maxY - minY + opts.padding * 2 : 600;

    return {
      nodes: layoutNodes,
      edges: layoutEdges,
      nodeMap,
      width,
      height,
      bounds: { minX, minY, maxX, maxY },
    };
  }

  /**
   * Computes orientation-aware plaque bounding box to prevent overlap.
   */
  private computePlaqueGeometry(
    nodeX: number,
    nodeY: number,
    radius: number,
    plaqueWidth: number,
    plaqueHeight: number,
    direction: LayoutDirection,
    index: number
  ): LayoutPlaque {
    if (direction === 'LR' || direction === 'RL') {
      // Horizontal flow: place plaque Above or Below node (alternating)
      const placeAbove = index % 2 === 0;
      return {
        x: nodeX - plaqueWidth / 2,
        y: placeAbove ? nodeY - plaqueHeight - radius - 10 : nodeY + radius + 10,
        width: plaqueWidth,
        height: plaqueHeight,
        placement: placeAbove ? 'top' : 'bottom',
      };
    }

    // Vertical flow (TB/BT): place plaque to the Right
    return {
      x: nodeX + radius + 14,
      y: nodeY - plaqueHeight / 2,
      width: plaqueWidth,
      height: plaqueHeight,
      placement: 'right',
    };
  }

  /**
   * Maps each commit to its associated branch name using ref pointers and topological traversal.
   */
  private assignCommitBranches(
    commits: CommitNode[],
    branches: BranchInfo[],
    mainBranchName: string
  ): Map<string, string> {
    const commitBranchMap = new Map<string, string>();
    const branchHeadMap = new Map<string, string>();

    for (const branch of branches) {
      if (branch.headHash) {
        branchHeadMap.set(branch.headHash, branch.name);
      }
    }

    // 1. Direct refs
    for (const commit of commits) {
      if (branchHeadMap.has(commit.hash)) {
        commitBranchMap.set(commit.hash, branchHeadMap.get(commit.hash)!);
        continue;
      }

      for (const ref of commit.refs) {
        const cleanRef = ref.replace(/^HEAD -> /, '').replace(/^origin\//, '').replace(/^tag: /, '');
        if (cleanRef) {
          commitBranchMap.set(commit.hash, cleanRef);
          break;
        }
      }
    }

    // 2. Propagate parent lines — prioritize main branch first to maintain continuous trunk
    const sortedCommitsForBranching = [...commits].sort((a, b) => {
      const aBranch = commitBranchMap.get(a.hash);
      const bBranch = commitBranchMap.get(b.hash);
      const aIsMain = aBranch === mainBranchName ? 1 : 0;
      const bIsMain = bBranch === mainBranchName ? 1 : 0;
      return bIsMain - aIsMain;
    });

    for (const commit of sortedCommitsForBranching) {
      const currentBranch = commitBranchMap.get(commit.hash);
      if (currentBranch && commit.parents.length > 0) {
        const firstParent = commit.parents[0];
        if (firstParent && !commitBranchMap.has(firstParent)) {
          commitBranchMap.set(firstParent, currentBranch);
        }
      }
    }

    return commitBranchMap;
  }
}

import dagre from '@dagrejs/dagre';
import type { CommitNode, BranchInfo } from '../../../extension/git-data';

// ─── Public Layout Types ───────────────────────────────────────────────────────

export type CommitNodeType =
  | 'initial'  // Root commit (no parents)
  | 'commit'   // Standard single-parent commit
  | 'merge'    // 2-parent merge commit
  | 'octopus'  // 3+ parent octopus merge
  | 'stash';   // Stash commit

export interface LayoutNode {
  hash: string;
  shortHash: string;
  subject: string;
  author: string;
  authorEmail: string;
  date: Date;
  relativeTime: string;
  x: number;
  y: number;
  radius: number;
  nodeType: CommitNodeType;
  branchName: string;
  branchColor: string;
  isHead: boolean;
  isMerge: boolean;
  isMainBranch: boolean;
  refs: string[];
  parents: string[];
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
  direction?: 'TB' | 'LR';
  viewMode?: 'topo' | 'temporal';
  nodeRadius?: number;
  nodeSpacingX?: number;
  nodeSpacingY?: number;
  padding?: number;
}

// ─── Helper: Relative Time ────────────────────────────────────────────────────

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

// ─── DAGLayoutEngine ──────────────────────────────────────────────────────────

export class DAGLayoutEngine {
  private readonly defaultOptions: Required<LayoutOptions> = {
    direction: 'TB',
    viewMode: 'topo',
    nodeRadius: 8,
    nodeSpacingX: 52,
    nodeSpacingY: 48,
    padding: 36,
  };

  /**
   * Computes layout coordinates (x, y) for all commit nodes and edge spline points.
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

    // Identify primary trunk branch (main / master)
    const mainBranch =
      branches.find((b) => b.name === 'main' || b.name === 'master') ??
      branches.find((b) => b.isHead) ??
      branches[0];
    const mainBranchName = mainBranch?.name ?? 'main';

    const headBranch = branches.find((b) => b.isHead);
    const headCommitHash = headBranch?.headHash;

    const commitBranchMap = this.assignCommitBranches(commits, branches, mainBranchName);

    if (opts.viewMode === 'temporal') {
      return this.layoutTemporal(commits, branches, commitBranchMap, colorMap, mainBranchName, headCommitHash, opts);
    }

    return this.layoutTopo(commits, branches, commitBranchMap, colorMap, mainBranchName, headCommitHash, opts);
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
    const g = new dagre.graphlib.Graph({ multigraph: true });
    g.setGraph({
      rankdir: opts.direction,
      nodesep: opts.nodeSpacingX,
      ranksep: opts.nodeSpacingY,
      marginx: opts.padding,
      marginy: opts.padding,
      ranker: 'tight-tree',
    });
    g.setDefaultEdgeLabel(() => ({}));

    const nodeDiameter = opts.nodeRadius * 2;
    for (const commit of commits) {
      g.setNode(commit.hash, {
        width: nodeDiameter,
        height: nodeDiameter,
      });
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

    for (const commit of commits) {
      const dagreNode = g.node(commit.hash);
      const x = dagreNode?.x ?? opts.padding;
      const y = dagreNode?.y ?? opts.padding;

      const branchName = commitBranchMap.get(commit.hash) ?? mainBranchName;
      const isMainBranch = branchName === mainBranchName || branchName.endsWith(`/${mainBranchName}`);
      const branchColor = colorMap.get(branchName) ?? (isMainBranch ? '#4ec9b0' : '#569cd6');

      const isHead = commit.hash === headCommitHash || commit.refs.some((r) => r.includes('HEAD'));
      const isMerge = commit.parents.length > 1;

      let nodeType: CommitNodeType = 'commit';
      if (commit.parents.length === 0) {
        nodeType = 'initial';
      } else if (commit.parents.length === 2) {
        nodeType = 'merge';
      } else if (commit.parents.length > 2) {
        nodeType = 'octopus';
      } else if (commit.subject.startsWith('WIP on ')) {
        nodeType = 'stash';
      }

      minX = Math.min(minX, x - opts.nodeRadius);
      minY = Math.min(minY, y - opts.nodeRadius);
      maxX = Math.max(maxX, x + opts.nodeRadius);
      maxY = Math.max(maxY, y + opts.nodeRadius);

      const layoutNode: LayoutNode = {
        hash: commit.hash,
        shortHash: commit.shortHash || commit.hash.slice(0, 8),
        subject: commit.subject,
        author: commit.author,
        authorEmail: commit.authorEmail,
        date: commit.date,
        relativeTime: formatRelativeTime(commit.date),
        x,
        y,
        radius: isMainBranch ? opts.nodeRadius + 1 : opts.nodeRadius,
        nodeType,
        branchName,
        branchColor,
        isHead,
        isMerge,
        isMainBranch,
        refs: commit.refs,
        parents: commit.parents,
      };

      layoutNodes.push(layoutNode);
      nodeMap.set(commit.hash, layoutNode);
    }

    const layoutEdges: LayoutEdge[] = [];
    for (const edgeObj of g.edges()) {
      const dagreEdge = g.edge(edgeObj);
      const sourceNode = nodeMap.get(edgeObj.v);
      const targetNode = nodeMap.get(edgeObj.w);

      if (!sourceNode || !targetNode) continue;

      let points: { x: number; y: number }[] = [];
      if (dagreEdge?.points && dagreEdge.points.length > 0) {
        points = dagreEdge.points.map((p: { x: number; y: number }) => ({ x: p.x, y: p.y }));
      } else {
        points = [
          { x: sourceNode.x, y: sourceNode.y },
          { x: targetNode.x, y: targetNode.y },
        ];
      }

      const isMainEdge = sourceNode.isMainBranch && targetNode.isMainBranch;

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
   * Temporal Layout (Sequential Timeline View with Main as the Central Trunk)
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

    // Assign lane columns (Main = Lane 0, features = Lane 1, 2, 3...)
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

    for (let rowIndex = 0; rowIndex < sortedCommits.length; rowIndex++) {
      const commit = sortedCommits[rowIndex]!;
      const branchName = commitBranchMap.get(commit.hash) ?? mainBranchName;
      const isMainBranch = branchName === mainBranchName || branchName.endsWith(`/${mainBranchName}`);
      const branchColor = colorMap.get(branchName) ?? (isMainBranch ? '#4ec9b0' : '#569cd6');

      const laneIndex = laneMap.get(branchName) ?? 0;
      const x = opts.padding + laneIndex * opts.nodeSpacingX;
      const y = opts.padding + rowIndex * opts.nodeSpacingY;

      const isHead = commit.hash === headCommitHash || commit.refs.some((r) => r.includes('HEAD'));
      const isMerge = commit.parents.length > 1;

      let nodeType: CommitNodeType = 'commit';
      if (commit.parents.length === 0) {
        nodeType = 'initial';
      } else if (commit.parents.length === 2) {
        nodeType = 'merge';
      } else if (commit.parents.length > 2) {
        nodeType = 'octopus';
      } else if (commit.subject.startsWith('WIP on ')) {
        nodeType = 'stash';
      }

      minX = Math.min(minX, x - opts.nodeRadius);
      minY = Math.min(minY, y - opts.nodeRadius);
      maxX = Math.max(maxX, x + opts.nodeRadius);
      maxY = Math.max(maxY, y + opts.nodeRadius);

      const layoutNode: LayoutNode = {
        hash: commit.hash,
        shortHash: commit.shortHash || commit.hash.slice(0, 8),
        subject: commit.subject,
        author: commit.author,
        authorEmail: commit.authorEmail,
        date: commit.date,
        relativeTime: formatRelativeTime(commit.date),
        x,
        y,
        radius: isMainBranch ? opts.nodeRadius + 1 : opts.nodeRadius,
        nodeType,
        branchName,
        branchColor,
        isHead,
        isMerge,
        isMainBranch,
        refs: commit.refs,
        parents: commit.parents,
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

        // Smooth Bézier curve between lanes
        const midY = (sourceNode.y + targetNode.y) / 2;
        const points = [
          { x: sourceNode.x, y: sourceNode.y },
          { x: sourceNode.x, y: midY },
          { x: targetNode.x, y: midY },
          { x: targetNode.x, y: targetNode.y },
        ];

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

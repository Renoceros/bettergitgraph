import dagre from '@dagrejs/dagre';
import type { CommitNode, BranchInfo } from '../../../extension/git-data';

// ─── Public Layout Types ───────────────────────────────────────────────────────

export interface LayoutNode {
  hash: string;
  shortHash: string;
  subject: string;
  author: string;
  authorEmail: string;
  date: Date;
  x: number;
  y: number;
  radius: number;
  branchName: string;
  branchColor: string;
  isHead: boolean;
  isMerge: boolean;
  refs: string[];
  parents: string[];
}

export interface LayoutEdge {
  source: string; // child commit hash
  target: string; // parent commit hash
  color: string;
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
  nodeRadius?: number;
  nodeSpacingX?: number;
  nodeSpacingY?: number;
  padding?: number;
}

// ─── DAGLayoutEngine ──────────────────────────────────────────────────────────

export class DAGLayoutEngine {
  private readonly defaultOptions: Required<LayoutOptions> = {
    direction: 'TB',
    nodeRadius: 8,
    nodeSpacingX: 48,
    nodeSpacingY: 44,
    padding: 32,
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

    // Find HEAD commit hash
    const headBranch = branches.find((b) => b.isHead);
    const headCommitHash = headBranch?.headHash;

    // Map each commit to a branch name
    const commitBranchMap = this.assignCommitBranches(commits, branches);

    // Add nodes to Dagre
    const nodeDiameter = opts.nodeRadius * 2;
    for (const commit of commits) {
      g.setNode(commit.hash, {
        width: nodeDiameter,
        height: nodeDiameter,
      });
    }

    // Add edges (parent -> child so topological order flows down/right)
    const commitSet = new Set(commits.map((c) => c.hash));
    for (const commit of commits) {
      for (const parentHash of commit.parents) {
        if (commitSet.has(parentHash)) {
          // Edge from child to parent in git history
          g.setEdge(commit.hash, parentHash, {}, `${commit.hash}->${parentHash}`);
        }
      }
    }

    // Run Dagre layout computation
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

      const branchName = commitBranchMap.get(commit.hash) ?? 'main';
      const branchColor = colorMap.get(branchName) ?? '#4ec9b0';
      const isHead = commit.hash === headCommitHash || commit.refs.some((r) => r.includes('HEAD'));
      const isMerge = commit.parents.length > 1;

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
        x,
        y,
        radius: opts.nodeRadius,
        branchName,
        branchColor,
        isHead,
        isMerge,
        refs: commit.refs,
        parents: commit.parents,
      };

      layoutNodes.push(layoutNode);
      nodeMap.set(commit.hash, layoutNode);
    }

    // Build edges with calculated Dagre points
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
        // Fallback simple line between nodes
        points = [
          { x: sourceNode.x, y: sourceNode.y },
          { x: targetNode.x, y: targetNode.y },
        ];
      }

      layoutEdges.push({
        source: edgeObj.v,
        target: edgeObj.w,
        color: sourceNode.branchColor,
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
   * Maps each commit to its associated branch name using ref pointers and topological traversal.
   */
  private assignCommitBranches(
    commits: CommitNode[],
    branches: BranchInfo[]
  ): Map<string, string> {
    const commitBranchMap = new Map<string, string>();
    const branchHeadMap = new Map<string, string>(); // hash -> branchName

    // Direct ref mappings
    for (const branch of branches) {
      if (branch.headHash) {
        branchHeadMap.set(branch.headHash, branch.name);
      }
    }

    // First pass: assign from branch heads and refs
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

    // Second pass: propagate branch names down parent lines
    for (const commit of commits) {
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

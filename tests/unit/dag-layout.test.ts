import { describe, it, expect } from 'vitest';
import { DAGLayoutEngine, formatRelativeTime } from '../../src/webview/components/GraphCanvas/dag-layout';
import type { CommitNode, BranchInfo } from '../../src/extension/git-data';

describe('DAGLayoutEngine', () => {
  const engine = new DAGLayoutEngine();

  it('handles empty commit graph gracefully', () => {
    const layout = engine.layout([], []);
    expect(layout.nodes).toEqual([]);
    expect(layout.edges).toEqual([]);
    expect(layout.width).toBe(0);
    expect(layout.height).toBe(0);
  });

  it('lays out a single root commit as initial nodeType', () => {
    const commits: CommitNode[] = [
      {
        hash: 'c1',
        shortHash: 'c1',
        subject: 'root',
        author: 'Dev',
        authorEmail: 'dev@test.com',
        date: new Date(),
        parents: [],
        refs: ['HEAD -> main'],
      },
    ];

    const layout = engine.layout(commits);
    expect(layout.nodes.length).toBe(1);
    expect(layout.nodes[0]?.hash).toBe('c1');
    expect(layout.nodes[0]?.nodeType).toBe('initial');
    expect(layout.nodes[0]?.isMainBranch).toBe(true);
    expect(layout.nodes[0]?.x).toBeGreaterThan(0);
    expect(layout.nodes[0]?.y).toBeGreaterThan(0);
    expect(layout.edges.length).toBe(0);
  });

  it('lays out a linear commit chain with non-overlapping nodes', () => {
    const commits: CommitNode[] = [
      { hash: 'c3', shortHash: 'c3', subject: 'third', author: 'A', authorEmail: 'a@a.com', date: new Date(), parents: ['c2'], refs: ['HEAD -> main'] },
      { hash: 'c2', shortHash: 'c2', subject: 'second', author: 'A', authorEmail: 'a@a.com', date: new Date(), parents: ['c1'], refs: [] },
      { hash: 'c1', shortHash: 'c1', subject: 'first', author: 'A', authorEmail: 'a@a.com', date: new Date(), parents: [], refs: [] },
    ];

    const layout = engine.layout(commits);
    expect(layout.nodes.length).toBe(3);
    expect(layout.edges.length).toBe(2);

    const node1 = layout.nodeMap.get('c1')!;
    const node2 = layout.nodeMap.get('c2')!;
    const node3 = layout.nodeMap.get('c3')!;

    expect(node1).toBeDefined();
    expect(node2).toBeDefined();
    expect(node3).toBeDefined();

    expect(node3.y).not.toBe(node2.y);
    expect(node2.y).not.toBe(node1.y);
    expect(layout.edges[0]?.points.length).toBeGreaterThanOrEqual(2);
  });

  it('lays out a 2-parent merge commit and flags nodeType: merge', () => {
    const commits: CommitNode[] = [
      { hash: 'c4', shortHash: 'c4', subject: 'merge', author: 'A', authorEmail: 'a@a.com', date: new Date(), parents: ['c2', 'c3'], refs: ['HEAD -> main'] },
      { hash: 'c3', shortHash: 'c3', subject: 'feature commit', author: 'B', authorEmail: 'b@b.com', date: new Date(), parents: ['c1'], refs: ['feature/login'] },
      { hash: 'c2', shortHash: 'c2', subject: 'main commit', author: 'A', authorEmail: 'a@a.com', date: new Date(), parents: ['c1'], refs: [] },
      { hash: 'c1', shortHash: 'c1', subject: 'root', author: 'A', authorEmail: 'a@a.com', date: new Date(), parents: [], refs: [] },
    ];

    const branches: BranchInfo[] = [
      { name: 'main', isRemote: false, isHead: true, headHash: 'c4', aheadCount: 0, behindCount: 0 },
      { name: 'feature/login', isRemote: false, isHead: false, headHash: 'c3', aheadCount: 0, behindCount: 0 },
    ];

    const layout = engine.layout(commits, branches);
    expect(layout.nodes.length).toBe(4);

    const mergeNode = layout.nodeMap.get('c4')!;
    expect(mergeNode.isMerge).toBe(true);
    expect(mergeNode.nodeType).toBe('merge');
    expect(mergeNode.isHead).toBe(true);

    const normalNode = layout.nodeMap.get('c3')!;
    expect(normalNode.isMerge).toBe(false);
    expect(normalNode.nodeType).toBe('commit');

    const mergeEdges = layout.edges.filter((e) => e.source === 'c4');
    expect(mergeEdges.length).toBe(2);
  });

  it('lays out an octopus merge with 3 parents and flags nodeType: octopus', () => {
    const commits: CommitNode[] = [
      { hash: 'm1', shortHash: 'm1', subject: 'octopus merge', author: 'A', authorEmail: 'a@a.com', date: new Date(), parents: ['p1', 'p2', 'p3'], refs: ['HEAD -> main'] },
      { hash: 'p1', shortHash: 'p1', subject: 'branch 1', author: 'A', authorEmail: 'a@a.com', date: new Date(), parents: ['root'], refs: ['b1'] },
      { hash: 'p2', shortHash: 'p2', subject: 'branch 2', author: 'A', authorEmail: 'a@a.com', date: new Date(), parents: ['root'], refs: ['b2'] },
      { hash: 'p3', shortHash: 'p3', subject: 'branch 3', author: 'A', authorEmail: 'a@a.com', date: new Date(), parents: ['root'], refs: ['b3'] },
      { hash: 'root', shortHash: 'root', subject: 'root', author: 'A', authorEmail: 'a@a.com', date: new Date(), parents: [], refs: [] },
    ];

    const layout = engine.layout(commits);
    expect(layout.nodes.length).toBe(5);

    const octopusNode = layout.nodeMap.get('m1')!;
    expect(octopusNode.isMerge).toBe(true);
    expect(octopusNode.nodeType).toBe('octopus');
    expect(octopusNode.parents.length).toBe(3);

    const edges = layout.edges.filter((e) => e.source === 'm1');
    expect(edges.length).toBe(3);
  });

  it('supports chronological Timeline (temporal) view mode with Main as central trunk', () => {
    const commits: CommitNode[] = [
      { hash: 'c3', shortHash: 'c3', subject: 'recent', author: 'A', authorEmail: 'a@a.com', date: new Date(1700000300000), parents: ['c1'], refs: ['HEAD -> main'] },
      { hash: 'c2', shortHash: 'c2', subject: 'middle', author: 'B', authorEmail: 'b@b.com', date: new Date(1700000200000), parents: ['c1'], refs: ['feature/x'] },
      { hash: 'c1', shortHash: 'c1', subject: 'oldest', author: 'A', authorEmail: 'a@a.com', date: new Date(1700000100000), parents: [], refs: [] },
    ];

    const branches: BranchInfo[] = [
      { name: 'main', isRemote: false, isHead: true, headHash: 'c3', aheadCount: 0, behindCount: 0 },
      { name: 'feature/x', isRemote: false, isHead: false, headHash: 'c2', aheadCount: 0, behindCount: 0 },
    ];

    const temporalLayout = engine.layout(commits, branches, new Map(), { viewMode: 'temporal' });
    expect(temporalLayout.nodes.length).toBe(3);

    const nodeNewest = temporalLayout.nodeMap.get('c3')!;
    const nodeMiddle = temporalLayout.nodeMap.get('c2')!;
    const nodeOldest = temporalLayout.nodeMap.get('c1')!;

    // In temporal view, y strictly increases chronologically
    expect(nodeNewest.y).toBeLessThan(nodeMiddle.y);
    expect(nodeMiddle.y).toBeLessThan(nodeOldest.y);

    // Main commits should be on Lane 0 (x = padding)
    expect(nodeNewest.x).toBe(36);
    expect(nodeOldest.x).toBe(36);
  });

  it('formats relative time strings accurately', () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe('just now');

    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago');

    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(fiveDaysAgo)).toBe('5d ago');
  });
});

import { describe, it, expect } from 'vitest';
import { DAGLayoutEngine, formatRelativeTime, formatCommitDate } from '../../src/webview/components/GraphCanvas/dag-layout';
import { exportGraphToSvg } from '../../src/webview/utils/svg-exporter';
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

  it('lays out a single root commit as initial nodeType with plaque', () => {
    const commits: CommitNode[] = [
      {
        hash: 'c1',
        shortHash: 'c1',
        subject: 'root commit',
        author: 'Dev',
        authorEmail: 'dev@test.com',
        date: new Date(),
        parents: [],
        refs: ['HEAD -> main'],
      },
    ];

    const layout = engine.layout(commits);
    expect(layout.nodes.length).toBe(1);
    const node = layout.nodes[0]!;
    expect(node.hash).toBe('c1');
    expect(node.nodeType).toBe('initial');
    expect(node.isMainBranch).toBe(true);
    expect(node.plaque).toBeDefined();
    expect(node.plaque.placement).toBe('right');
    expect(node.plaque.x).toBeGreaterThan(node.x);
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
  });

  it('supports all 4 layout directions (TB, BT, LR, RL)', () => {
    const commits: CommitNode[] = [
      { hash: 'c2', shortHash: 'c2', subject: 'second', author: 'A', authorEmail: 'a@a.com', date: new Date(1700000200000), parents: ['c1'], refs: ['HEAD -> main'] },
      { hash: 'c1', shortHash: 'c1', subject: 'first', author: 'A', authorEmail: 'a@a.com', date: new Date(1700000100000), parents: [], refs: [] },
    ];

    // TB
    const layoutTB = engine.layout(commits, [], new Map(), { direction: 'TB', viewMode: 'temporal' });
    const n1TB = layoutTB.nodeMap.get('c1')!;
    const n2TB = layoutTB.nodeMap.get('c2')!;
    expect(n2TB.y).toBeLessThan(n1TB.y);
    expect(n2TB.plaque.placement).toBe('right');

    // BT (Inverted vertical)
    const layoutBT = engine.layout(commits, [], new Map(), { direction: 'BT', viewMode: 'temporal' });
    const n1BT = layoutBT.nodeMap.get('c1')!;
    const n2BT = layoutBT.nodeMap.get('c2')!;
    expect(n1BT.y).toBeLessThan(n2BT.y);

    // LR (Horizontal: time on X, plaque above/below)
    const layoutLR = engine.layout(commits, [], new Map(), { direction: 'LR', viewMode: 'temporal' });
    const n1LR = layoutLR.nodeMap.get('c1')!;
    const n2LR = layoutLR.nodeMap.get('c2')!;
    expect(n2LR.x).toBeLessThan(n1LR.x);
    expect(['top', 'bottom']).toContain(n2LR.plaque.placement);

    // RL (Horizontal Inverted)
    const layoutRL = engine.layout(commits, [], new Map(), { direction: 'RL', viewMode: 'temporal' });
    const n1RL = layoutRL.nodeMap.get('c1')!;
    const n2RL = layoutRL.nodeMap.get('c2')!;
    expect(n1RL.x).toBeLessThan(n2RL.x);
  });

  it('formats commit dates with local, relative, and iso styles', () => {
    const testDate = new Date('2026-08-24T12:30:00Z');

    const relativeStr = formatCommitDate(new Date(), 'relative');
    expect(relativeStr).toBe('just now');

    const isoStr = formatCommitDate(testDate, 'iso');
    expect(isoStr).toContain('2026-08-24');

    const localStr = formatCommitDate(testDate, 'local');
    expect(localStr).toContain('GMT');
  });

  it('exports graph to valid standalone SVG XML', () => {
    const commits: CommitNode[] = [
      { hash: 'c2', shortHash: 'c2', subject: 'second commit', author: 'Dev', authorEmail: 'dev@test.com', date: new Date(), parents: ['c1'], refs: ['HEAD -> main'] },
      { hash: 'c1', shortHash: 'c1', subject: 'initial commit', author: 'Dev', authorEmail: 'dev@test.com', date: new Date(), parents: [], refs: [] },
    ];

    const layout = engine.layout(commits);
    const svg = exportGraphToSvg(layout);

    expect(svg).toContain('<?xml version="1.0"');
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('INITIAL');
    expect(svg).toContain('second commit');
    expect(svg).toContain('</svg>');
  });
});

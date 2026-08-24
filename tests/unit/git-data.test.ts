import { describe, it, expect, beforeAll } from 'vitest';
import simpleGit from 'simple-git';
import path from 'path';
import fs from 'fs';
import { GitDataLayer } from '../../src/extension/git-data';

const FIXTURE_REPO_PATH = path.resolve(__dirname, '../../test-fixtures/sample-repo');

describe('GitDataLayer', () => {
  let gitData: GitDataLayer;

  beforeAll(() => {
    // Verify fixture repo exists
    if (!fs.existsSync(FIXTURE_REPO_PATH)) {
      throw new Error(`Fixture repo not found at ${FIXTURE_REPO_PATH}. Run scripts/create-fixture-repo.sh first.`);
    }
    const git = simpleGit(FIXTURE_REPO_PATH);
    gitData = new GitDataLayer(git, FIXTURE_REPO_PATH);
  });

  it('retrieves and parses commit graph including linear, merge, and octopus merge commits', async () => {
    const { commits, edges } = await gitData.getCommitGraph({ maxCount: 100 });

    expect(commits.length).toBeGreaterThanOrEqual(6);
    expect(edges.length).toBeGreaterThan(0);

    // Root commit should have 0 parents
    const rootCommit = commits.find((c) => c.subject.includes('root'));
    expect(rootCommit).toBeDefined();
    expect(rootCommit?.parents).toEqual([]);

    // 2-parent merge commit
    const twoParentMerge = commits.find((c) => c.subject.includes('merge: merge feature/auth'));
    expect(twoParentMerge).toBeDefined();
    expect(twoParentMerge?.parents.length).toBe(2);

    // Octopus merge commit (3 parents: main, octo/branch-a, octo/branch-b)
    const octopusMerge = commits.find((c) => c.subject.startsWith('merge: octopus merge'));
    expect(octopusMerge).toBeDefined();
    expect(octopusMerge?.parents.length).toBe(3);

    // Verify edges include all parent relationships
    const octopusEdges = edges.filter(([child]) => child === octopusMerge?.hash);
    expect(octopusEdges.length).toBe(3);
  });

  it('retrieves branches with tracking and status', async () => {
    const branches = await gitData.getAllBranches();

    expect(branches.length).toBeGreaterThan(0);
    const mainBranch = branches.find((b) => b.name === 'main');
    expect(mainBranch).toBeDefined();
    expect(mainBranch?.isHead).toBe(true);
    expect(mainBranch?.headHash.length).toBeGreaterThan(0);

    const authBranch = branches.find((b) => b.name === 'feature/auth');
    expect(authBranch).toBeDefined();
    expect(authBranch?.isHead).toBe(false);
  });

  it('retrieves tags with metadata', async () => {
    const tags = await gitData.getTags();

    expect(tags.length).toBeGreaterThanOrEqual(2);
    const tagNames = tags.map((t) => t.name);
    expect(tagNames).toContain('v0.1.0');
    expect(tagNames).toContain('v1.0.0');
  });

  it('retrieves stash entries', async () => {
    const stashes = await gitData.getStashes();

    expect(stashes.length).toBeGreaterThanOrEqual(1);
    expect(stashes[0]?.message).toContain('WIP on docs update');
  });

  it('retrieves changed files for a root commit without crashing', async () => {
    const { commits } = await gitData.getCommitGraph();
    const rootCommit = commits.find((c) => c.subject.includes('root'));
    expect(rootCommit).toBeDefined();

    const files = await gitData.getCommitFiles(rootCommit!.hash);
    expect(files.length).toBeGreaterThanOrEqual(1);
    expect(files[0]?.path).toBe('README.md');
    expect(files[0]?.status).toBe('A');
  });

  it('retrieves changed files for merge and linear commits', async () => {
    const { commits } = await gitData.getCommitGraph();
    const linearCommit = commits.find((c) => c.subject.includes('add entry point'));
    expect(linearCommit).toBeDefined();

    const files = await gitData.getCommitFiles(linearCommit!.hash);
    expect(files.some((f) => f.path === 'index.js')).toBe(true);
  });

  it('retrieves file diff at a specific commit', async () => {
    const { commits } = await gitData.getCommitGraph();
    const linearCommit = commits.find((c) => c.subject.includes('add entry point'));
    expect(linearCommit).toBeDefined();

    const diff = await gitData.getFileDiff(linearCommit!.hash, 'index.js');
    expect(diff).toContain("console.log('init');");
  });
});

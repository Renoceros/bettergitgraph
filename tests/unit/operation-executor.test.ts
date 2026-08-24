import { describe, it, expect, beforeAll } from 'vitest';
import simpleGit from 'simple-git';
import path from 'path';
import fs from 'fs';
import { GitOperationExecutor } from '../../src/extension/operation-executor';

const FIXTURE_REPO_PATH = path.resolve(__dirname, '../../test-fixtures/sample-repo');

describe('GitOperationExecutor', () => {
  let executor: GitOperationExecutor;

  beforeAll(() => {
    if (!fs.existsSync(FIXTURE_REPO_PATH)) {
      throw new Error('Fixture repo not found');
    }
    const git = simpleGit(FIXTURE_REPO_PATH);
    executor = new GitOperationExecutor(git, FIXTURE_REPO_PATH);
  });

  it('rejects hard reset if confirmed flag is missing', async () => {
    const result = await executor.execute({
      op: 'RESET',
      mode: 'hard',
      hash: '31e4607',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('CONFIRMATION_REQUIRED');
  });

  it('rejects force branch deletion if confirmed flag is missing', async () => {
    const result = await executor.execute({
      op: 'DELETE_BRANCH',
      name: 'non-existent-branch',
      force: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('CONFIRMATION_REQUIRED');
  });

  it('creates and deletes a temporary test branch safely', async () => {
    const createResult = await executor.execute({
      op: 'CREATE_BRANCH',
      name: 'test/temporary-branch',
      hash: '31e4607',
    });

    expect(createResult.success).toBe(true);
    expect(createResult.commandRun).toContain('git branch test/temporary-branch');

    const deleteResult = await executor.execute({
      op: 'DELETE_BRANCH',
      name: 'test/temporary-branch',
      force: true,
      confirmed: true,
    });

    expect(deleteResult.success).toBe(true);
  });

  it('creates a tag on a commit', async () => {
    const tagName = `v-test-tag-${Date.now()}`;
    const tagResult = await executor.execute({
      op: 'TAG',
      name: tagName,
      hash: '31e4607',
    });

    expect(tagResult.success).toBe(true);
  });

  it('records executed operations in audit log', () => {
    const logs = executor.getOperationLogs();
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0]?.operation).toBeDefined();
  });
});

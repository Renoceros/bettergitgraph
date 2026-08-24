import { describe, it, expect } from 'vitest';
import { BranchColorEngine } from '../../src/extension/color-engine';

describe('BranchColorEngine', () => {
  it('deterministically returns the exact same color for the same branch name', () => {
    const engine = new BranchColorEngine('dark');
    const firstCall = engine.getColor('main');

    for (let i = 0; i < 1000; i++) {
      expect(engine.getColor('main')).toBe(firstCall);
    }
  });

  it('generates distinct colors for different branch names', () => {
    const engine = new BranchColorEngine('dark');
    const mainColor = engine.getColor('main');
    const featureColor = engine.getColor('feature/login-oauth');
    const releaseColor = engine.getColor('release/v1.0.0');

    expect(mainColor).not.toBe(featureColor);
    expect(featureColor).not.toBe(releaseColor);
  });

  it('adjusts lightness based on light vs dark theme', () => {
    const darkEngine = new BranchColorEngine('dark');
    const lightEngine = new BranchColorEngine('light');

    const darkColor = darkEngine.getColor('feature/dashboard');
    const lightColor = lightEngine.getColor('feature/dashboard');

    expect(darkColor).toContain('55%');
    expect(lightColor).toContain('40%');
  });

  it('supports explicit per-branch color overrides', () => {
    const engine = new BranchColorEngine('dark');
    const defaultColor = engine.getColor('hotfix/critical');

    engine.setOverride('hotfix/critical', '#ff0055');
    expect(engine.getColor('hotfix/critical')).toBe('#ff0055');

    engine.removeOverride('hotfix/critical');
    expect(engine.getColor('hotfix/critical')).toBe(defaultColor);
  });

  it('returns a batch Map of colors for branch list', () => {
    const engine = new BranchColorEngine('dark');
    const branches = ['main', 'dev', 'staging'];
    const map = engine.getAllColors(branches);

    expect(map.size).toBe(3);
    expect(map.get('main')).toBe(engine.getColor('main'));
    expect(map.get('dev')).toBe(engine.getColor('dev'));
  });
});

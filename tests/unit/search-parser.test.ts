import { describe, it, expect } from 'vitest';
import { parseSearchQuery } from '../../src/webview/utils/search-parser';

describe('search-parser', () => {
  it('handles empty queries', () => {
    const parsed = parseSearchQuery('');
    expect(parsed.isPrefixSearch).toBe(false);
    expect(parsed.authors).toEqual([]);
    expect(parsed.branches).toEqual([]);
    expect(parsed.files).toEqual([]);
    expect(parsed.messages).toEqual([]);
    expect(parsed.types).toEqual([]);
  });

  it('parses @author queries', () => {
    const parsed = parseSearchQuery('@renoce');
    expect(parsed.isPrefixSearch).toBe(true);
    expect(parsed.authors).toEqual(['renoce']);

    const parsed2 = parseSearchQuery('author:moreno');
    expect(parsed2.isPrefixSearch).toBe(true);
    expect(parsed2.authors).toEqual(['moreno']);
  });

  it('parses #branch and branch:name queries', () => {
    const parsed = parseSearchQuery('#feature/login');
    expect(parsed.isPrefixSearch).toBe(true);
    expect(parsed.branches).toEqual(['feature/login']);

    const parsed2 = parseSearchQuery('branch:404');
    expect(parsed2.isPrefixSearch).toBe(true);
    expect(parsed2.branches).toEqual(['404']);
  });

  it('parses file:path and /path queries', () => {
    const parsed = parseSearchQuery('file:dag-layout.ts');
    expect(parsed.isPrefixSearch).toBe(true);
    expect(parsed.files).toEqual(['dag-layout.ts']);

    const parsed2 = parseSearchQuery('/components/SearchBar');
    expect(parsed2.isPrefixSearch).toBe(true);
    expect(parsed2.files).toEqual(['components/searchbar']);
  });

  it('parses msg:text and quoted exact phrases', () => {
    const parsed = parseSearchQuery('msg:merge');
    expect(parsed.isPrefixSearch).toBe(true);
    expect(parsed.messages).toEqual(['merge']);

    const parsed2 = parseSearchQuery('"fix auth token bug"');
    expect(parsed2.isPrefixSearch).toBe(true);
    expect(parsed2.messages).toEqual(['fix auth token bug']);
  });

  it('parses node types (is:pr, is:issue, is:merge, is:initial)', () => {
    const parsed = parseSearchQuery('is:pr');
    expect(parsed.isPrefixSearch).toBe(true);
    expect(parsed.types).toEqual(['pr']);

    const parsed2 = parseSearchQuery('is:issue');
    expect(parsed2.isPrefixSearch).toBe(true);
    expect(parsed2.types).toEqual(['issue']);

    const parsed3 = parseSearchQuery('type:merge');
    expect(parsed3.isPrefixSearch).toBe(true);
    expect(parsed3.types).toEqual(['merge']);
  });

  it('parses sha:hash and hash:hash queries', () => {
    const parsed = parseSearchQuery('sha:431511d');
    expect(parsed.isPrefixSearch).toBe(true);
    expect(parsed.hashes).toEqual(['431511d']);

    const parsed2 = parseSearchQuery('hash:cacde46');
    expect(parsed2.isPrefixSearch).toBe(true);
    expect(parsed2.hashes).toEqual(['cacde46']);
  });

  it('parses numeric branches with #', () => {
    const parsed = parseSearchQuery('#404');
    expect(parsed.isPrefixSearch).toBe(true);
    expect(parsed.branches).toEqual(['404']);
  });

  it('parses title: and subject: prefixes', () => {
    const parsed = parseSearchQuery('title:release');
    expect(parsed.isPrefixSearch).toBe(true);
    expect(parsed.messages).toEqual(['release']);

    const parsed2 = parseSearchQuery('subject:hotfix');
    expect(parsed2.isPrefixSearch).toBe(true);
    expect(parsed2.messages).toEqual(['hotfix']);
  });

  it('parses compound queries with multiple prefixes', () => {
    const parsed = parseSearchQuery('@renoce is:pr file:dag-layout #main');
    expect(parsed.isPrefixSearch).toBe(true);
    expect(parsed.authors).toEqual(['renoce']);
    expect(parsed.types).toEqual(['pr']);
    expect(parsed.files).toEqual(['dag-layout']);
    expect(parsed.branches).toEqual(['main']);
  });

  it('falls back to raw terms for un-prefixed words', () => {
    const parsed = parseSearchQuery('refactor');
    expect(parsed.isPrefixSearch).toBe(false);
    expect(parsed.rawTerms).toEqual(['refactor']);
  });
});

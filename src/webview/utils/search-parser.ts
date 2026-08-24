export interface ParsedSearchQuery {
  raw: string;
  isPrefixSearch: boolean;
  authors: string[];
  branches: string[];
  files: string[];
  messages: string[];
  types: ('commit' | 'merge' | 'pr' | 'issue' | 'stash' | 'initial' | 'octopus')[];
  rawTerms: string[];
}

/**
 * Parses user input into structured search tokens supporting:
 * - @author or @username
 * - #branch or branch:name
 * - file:path or /path
 * - msg:text or "exact phrase"
 * - is:pr, is:issue, is:merge, is:initial
 * - un-prefixed terms (fallback global search)
 */
export function parseSearchQuery(query: string): ParsedSearchQuery {
  const trimmed = query.trim();
  const result: ParsedSearchQuery = {
    raw: trimmed,
    isPrefixSearch: false,
    authors: [],
    branches: [],
    files: [],
    messages: [],
    types: [],
    rawTerms: [],
  };

  if (!trimmed) return result;

  // Regex to extract quotes, prefixes, and whitespace-delimited tokens
  const tokenRegex = /"([^"]+)"|'([^']+)'|(\S+)/g;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(trimmed)) !== null) {
    const token = match[1] ?? match[2] ?? match[3] ?? '';
    if (!token) continue;

    const lower = token.toLowerCase();

    // 1. Author: @username or author:name
    if (token.startsWith('@') && token.length > 1) {
      result.authors.push(lower.slice(1));
      result.isPrefixSearch = true;
    } else if (lower.startsWith('author:') && token.length > 7) {
      result.authors.push(lower.slice(7));
      result.isPrefixSearch = true;
    }
    // 2. Branch: #branch or branch:name
    else if (token.startsWith('#') && token.length > 1 && !/^\d+$/.test(token.slice(1))) {
      result.branches.push(lower.slice(1));
      result.isPrefixSearch = true;
    } else if (lower.startsWith('branch:') && token.length > 7) {
      result.branches.push(lower.slice(7));
      result.isPrefixSearch = true;
    }
    // 3. Changed Files: file:path or path:path or starting with /
    else if (lower.startsWith('file:') && token.length > 5) {
      result.files.push(lower.slice(5));
      result.isPrefixSearch = true;
    } else if (lower.startsWith('path:') && token.length > 5) {
      result.files.push(lower.slice(5));
      result.isPrefixSearch = true;
    } else if (token.startsWith('/') && token.length > 1) {
      result.files.push(lower.slice(1));
      result.isPrefixSearch = true;
    }
    // 4. Commit Message: msg:text or quoted strings
    else if (lower.startsWith('msg:') && token.length > 4) {
      result.messages.push(lower.slice(4));
      result.isPrefixSearch = true;
    } else if (match[1] || match[2]) {
      // Quoted string -> message search
      result.messages.push(lower);
      result.isPrefixSearch = true;
    }
    // 5. Node Type: is:pr, is:issue, is:merge, is:initial, is:commit, is:stash
    else if (lower.startsWith('is:') && token.length > 3) {
      const typeVal = lower.slice(3) as ParsedSearchQuery['types'][number];
      if (['commit', 'merge', 'pr', 'issue', 'stash', 'initial', 'octopus'].includes(typeVal)) {
        result.types.push(typeVal);
        result.isPrefixSearch = true;
      } else {
        result.rawTerms.push(lower);
      }
    } else if (lower.startsWith('type:') && token.length > 5) {
      const typeVal = lower.slice(5) as ParsedSearchQuery['types'][number];
      if (['commit', 'merge', 'pr', 'issue', 'stash', 'initial', 'octopus'].includes(typeVal)) {
        result.types.push(typeVal);
        result.isPrefixSearch = true;
      } else {
        result.rawTerms.push(lower);
      }
    }
    // 6. General term
    else {
      result.rawTerms.push(lower);
    }
  }

  return result;
}

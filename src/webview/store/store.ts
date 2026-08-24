import { create } from 'zustand';
import type { CommitNode, BranchInfo, ChangedFile, FetchResult, RemoteRepoInfo } from '../../extension/git-data';
import type { GraphLayout, LayoutDirection, DateFormat } from '../components/GraphCanvas/dag-layout';
import { DAGLayoutEngine } from '../components/GraphCanvas/dag-layout';
import { BranchColorEngine } from '../../extension/color-engine';
import { messageBus } from './message-bus';
import { parseSearchQuery } from '../utils/search-parser';

// ─── App State Types ───────────────────────────────────────────────────────────

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
  width: number;
  height: number;
}

export interface CommitFileDetail {
  hash: string;
  files: ChangedFile[];
  diff?: string;
  loading: boolean;
}

export interface AppState {
  // Git data
  commits: CommitNode[];
  branches: BranchInfo[];
  remoteInfo: RemoteRepoInfo | null;
  layout: GraphLayout | null;
  selectedHash: string | null;
  hoveredHash: string | null;
  highlightedBranch: string | null;

  // Selected commit details
  commitDetail: CommitFileDetail | null;

  // Search & Filter
  searchQuery: string;
  filteredHashes: Set<string> | null;
  authorFilter: string[];
  branchFilter: string[];

  // Settings & Views
  viewMode: 'topo' | 'temporal';
  layoutDirection: LayoutDirection;
  dateFormat: DateFormat;
  beginnerMode: boolean;
  nodeRadius: number;
  theme: 'dark' | 'light' | 'high-contrast';
  viewport: Viewport;
  isFetching: boolean;
  lastFetchResult: FetchResult | null;

  // Actions
  setGraphData: (commits: CommitNode[], branches: BranchInfo[], remoteInfo?: RemoteRepoInfo | null) => void;
  selectCommit: (hash: string | null) => void;
  setHoveredCommit: (hash: string | null) => void;
  setHighlightedBranch: (branch: string | null) => void;
  setCommitDetail: (detail: Partial<CommitFileDetail>) => void;
  setSearchQuery: (query: string) => void;
  addFileSearchMatches: (query: string, hashes: string[]) => void;
  setAuthorFilter: (authors: string[]) => void;
  setBranchFilter: (branches: string[]) => void;
  setViewMode: (mode: 'topo' | 'temporal') => void;
  setLayoutDirection: (dir: LayoutDirection) => void;
  setDateFormat: (format: DateFormat) => void;
  setBeginnerMode: (enabled: boolean) => void;
  setTheme: (theme: 'dark' | 'light' | 'high-contrast') => void;
  setViewport: (updater: (prev: Viewport) => Viewport) => void;
  resetViewport: () => void;
  fitToScreen: () => void;
  setIsFetching: (fetching: boolean, result?: FetchResult) => void;
  recomputeLayout: () => void;
  openExternalUrl: (url: string) => void;
  openRepoOnWeb: () => void;
  openCommitOnWeb: (hash: string) => void;
  openBranchOnWeb: (branch: string) => void;
  openPrOnWeb: (prNumber: number) => void;
  openIssueOnWeb: (issueNumber: number) => void;
}

// ─── Color & Layout Singletons ────────────────────────────────────────────────

const layoutEngine = new DAGLayoutEngine();
const colorEngine = new BranchColorEngine('dark');
const commitFilesCache = new Map<string, ChangedFile[]>();
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export const useAppStore = create<AppState>((set, get) => ({
  commits: [],
  branches: [],
  remoteInfo: null,
  layout: null,
  selectedHash: null,
  hoveredHash: null,
  highlightedBranch: null,
  commitDetail: null,
  searchQuery: '',
  filteredHashes: null,
  authorFilter: [],
  branchFilter: [],
  viewMode: 'temporal',
  layoutDirection: 'TB',
  dateFormat: 'local',
  beginnerMode: true,
  nodeRadius: 8,
  theme: 'dark',
  viewport: { x: 50, y: 50, zoom: 1.0, width: 800, height: 600 },
  isFetching: false,
  lastFetchResult: null,

  setGraphData: (commits, branches, remoteInfo) => {
    const { layoutDirection, viewMode, dateFormat, nodeRadius, theme } = get();
    colorEngine.setTheme(theme);
    const branchNames = branches.map((b) => b.name);
    const colorMap = colorEngine.getAllColors(branchNames);

    const layout = layoutEngine.layout(commits, branches, colorMap, {
      direction: layoutDirection,
      viewMode,
      dateFormat,
      nodeRadius,
    });

    set({
      commits,
      branches,
      layout,
      ...(remoteInfo !== undefined ? { remoteInfo } : {}),
    });
    if (get().searchQuery) {
      get().setSearchQuery(get().searchQuery);
    }
  },

  recomputeLayout: () => {
    const { commits, branches, layoutDirection, viewMode, dateFormat, nodeRadius, theme } = get();
    colorEngine.setTheme(theme);
    const branchNames = branches.map((b) => b.name);
    const colorMap = colorEngine.getAllColors(branchNames);

    const layout = layoutEngine.layout(commits, branches, colorMap, {
      direction: layoutDirection,
      viewMode,
      dateFormat,
      nodeRadius,
    });

    set({ layout });
    if (get().searchQuery) {
      get().setSearchQuery(get().searchQuery);
    }
  },

  selectCommit: (hash) => {
    if (!hash) {
      set({ selectedHash: null, commitDetail: null });
      return;
    }

    set({
      selectedHash: hash,
      commitDetail: { hash, files: [], loading: true },
    });
  },

  setHoveredCommit: (hash) => set({ hoveredHash: hash }),

  setHighlightedBranch: (branch) => set({ highlightedBranch: branch }),

  setCommitDetail: (detail) => {
    if (detail.hash && detail.files && detail.files.length > 0) {
      commitFilesCache.set(detail.hash, detail.files);
    }
    set((state) => ({
      commitDetail: state.commitDetail
        ? { ...state.commitDetail, ...detail }
        : null,
    }));
  },

  setSearchQuery: (query) => {
    const trimmed = query.trim();
    if (!trimmed) {
      set({ searchQuery: '', filteredHashes: null });
      return;
    }

    const parsed = parseSearchQuery(trimmed);
    const { commits, branches, layout } = get();
    const matches = new Set<string>();

    if (parsed.isPrefixSearch) {
      // ── Scoped Prefix Search Mode (@author, #branch, file:, msg:, is:) ───
      const matchingBranchNames = new Set<string>();
      for (const b of branches) {
        const bName = b.name.toLowerCase();
        if (parsed.branches.some((target) => bName.includes(target))) {
          matchingBranchNames.add(bName);
        }
      }

      for (const c of commits) {
        const layoutNode = layout?.nodeMap.get(c.hash);
        const nodeBranch = layoutNode?.branchName?.toLowerCase() || '';

        // Author filter (@renoce)
        const matchAuthor =
          parsed.authors.length === 0 ||
          parsed.authors.some(
            (a) =>
              c.author.toLowerCase().includes(a) ||
              c.authorEmail.toLowerCase().includes(a)
          );

        // Branch filter (#feature, branch:404)
        const matchBranch =
          parsed.branches.length === 0 ||
          matchingBranchNames.has(nodeBranch) ||
          parsed.branches.some(
            (b) =>
              nodeBranch.includes(b) ||
              c.refs.some((r) => r.toLowerCase().includes(b))
          );

        // Message filter (msg:fix, "exact phrase")
        const matchMsg =
          parsed.messages.length === 0 ||
          parsed.messages.some((m) => c.subject.toLowerCase().includes(m));

        // Node Type filter (is:pr, is:issue, is:merge, is:initial)
        const matchType =
          parsed.types.length === 0 ||
          (layoutNode && parsed.types.includes(layoutNode.nodeType as any));

        // Cached file match (file:auth)
        const cachedFiles = commitFilesCache.get(c.hash);
        const matchCachedFile =
          parsed.files.length === 0 ||
          (cachedFiles &&
            parsed.files.some((f) =>
              cachedFiles.some((cf) => cf.path.toLowerCase().includes(f))
            ));

        // General terms within prefix search
        const matchRawTerms =
          parsed.rawTerms.length === 0 ||
          parsed.rawTerms.every(
            (term) =>
              c.subject.toLowerCase().includes(term) ||
              c.author.toLowerCase().includes(term) ||
              c.shortHash.toLowerCase().includes(term) ||
              nodeBranch.includes(term)
          );

        if (
          matchAuthor &&
          matchBranch &&
          matchMsg &&
          matchType &&
          matchCachedFile &&
          matchRawTerms
        ) {
          matches.add(c.hash);
        }
      }

      // If file search criteria are present, dispatch backend file search
      if (parsed.files.length > 0) {
        if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
          for (const fileToken of parsed.files) {
            messageBus.send({ type: 'SEARCH_CHANGED_FILES', payload: { query: fileToken } });
          }
        }, 250);
      }
    } else {
      // ── Universal Fuzzy Search Mode ───
      const lower = trimmed.toLowerCase();

      const matchingBranchNames = new Set<string>();
      for (const b of branches) {
        if (b.name.toLowerCase().includes(lower)) {
          matchingBranchNames.add(b.name.toLowerCase());
        }
      }

      for (const c of commits) {
        const layoutNode = layout?.nodeMap.get(c.hash);
        const nodeBranch = layoutNode?.branchName?.toLowerCase() || '';

        const matchesBranch =
          (nodeBranch && nodeBranch.includes(lower)) ||
          matchingBranchNames.has(nodeBranch);

        const cachedFiles = commitFilesCache.get(c.hash);
        const matchesCachedFile = cachedFiles?.some((f) =>
          f.path.toLowerCase().includes(lower)
        );

        const matchesDirect =
          c.subject.toLowerCase().includes(lower) ||
          c.author.toLowerCase().includes(lower) ||
          c.authorEmail.toLowerCase().includes(lower) ||
          c.shortHash.toLowerCase().includes(lower) ||
          c.hash.toLowerCase().includes(lower) ||
          c.refs.some((r) => r.toLowerCase().includes(lower));

        if (matchesDirect || matchesBranch || matchesCachedFile) {
          matches.add(c.hash);
        }
      }

      // Dispatch debounced file search
      if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
      if (lower.length >= 2) {
        searchDebounceTimer = setTimeout(() => {
          messageBus.send({ type: 'SEARCH_CHANGED_FILES', payload: { query: lower } });
        }, 250);
      }
    }

    set({ searchQuery: query, filteredHashes: matches });
  },

  addFileSearchMatches: (query, hashes) => {
    const currentQuery = get().searchQuery.trim().toLowerCase();
    if (query !== currentQuery || hashes.length === 0) return;

    set((state) => {
      const updated = new Set(state.filteredHashes ?? []);
      for (const h of hashes) {
        updated.add(h);
      }
      return { filteredHashes: updated };
    });
  },

  setAuthorFilter: (authors) => set({ authorFilter: authors }),
  setBranchFilter: (branches) => set({ branchFilter: branches }),

  setViewMode: (viewMode) => {
    set({ viewMode });
    get().recomputeLayout();
  },

  setLayoutDirection: (layoutDirection) => {
    set({ layoutDirection });
    get().recomputeLayout();
  },

  setDateFormat: (dateFormat) => {
    set({ dateFormat });
    get().recomputeLayout();
  },

  setBeginnerMode: (beginnerMode) => set({ beginnerMode }),

  setTheme: (theme) => {
    set({ theme });
    get().recomputeLayout();
  },

  setViewport: (updater) =>
    set((state) => ({ viewport: updater(state.viewport) })),

  resetViewport: () => {
    const { layout } = get();
    const headNode = layout?.nodes.find((n) => n.isHead) ?? layout?.nodes[0];
    if (headNode) {
      set((state) => ({
        viewport: {
          ...state.viewport,
          x: state.viewport.width / 2 - headNode.x,
          y: Math.max(50, state.viewport.height / 3 - headNode.y),
          zoom: 1.0,
        },
      }));
    } else {
      set((state) => ({
        viewport: { ...state.viewport, x: 50, y: 50, zoom: 1.0 },
      }));
    }
  },

  fitToScreen: () => {
    const { layout, viewport } = get();
    if (!layout || layout.nodes.length === 0) return;

    const padding = 60;
    const graphWidth = layout.bounds.maxX - layout.bounds.minX + padding * 2;
    const graphHeight = layout.bounds.maxY - layout.bounds.minY + padding * 2;

    const scaleX = viewport.width / graphWidth;
    const scaleY = viewport.height / graphHeight;
    const fitZoom = Math.min(1.5, Math.max(0.2, Math.min(scaleX, scaleY) * 0.9));

    const centerX = (layout.bounds.minX + layout.bounds.maxX) / 2;
    const centerY = (layout.bounds.minY + layout.bounds.maxY) / 2;

    set({
      viewport: {
        ...viewport,
        zoom: fitZoom,
        x: viewport.width / 2 - centerX * fitZoom,
        y: viewport.height / 2 - centerY * fitZoom,
      },
    });
  },

  setIsFetching: (isFetching, lastFetchResult) =>
    set({
      isFetching,
      ...(lastFetchResult ? { lastFetchResult } : {}),
    }),

  openExternalUrl: (url: string) => {
    if (!url) return;
    messageBus.send({ type: 'OPEN_EXTERNAL_URL', payload: { url } });
  },

  openRepoOnWeb: () => {
    const { remoteInfo } = get();
    if (remoteInfo?.webUrl) {
      get().openExternalUrl(remoteInfo.webUrl);
    }
  },

  openCommitOnWeb: (hash: string) => {
    const { remoteInfo } = get();
    if (!remoteInfo?.webUrl || !hash) return;
    const isGitLab = remoteInfo.provider === 'gitlab';
    const isBitbucket = remoteInfo.provider === 'bitbucket';
    const url = isGitLab
      ? `${remoteInfo.webUrl}/-/commit/${hash}`
      : isBitbucket
      ? `${remoteInfo.webUrl}/commits/${hash}`
      : `${remoteInfo.webUrl}/commit/${hash}`;
    get().openExternalUrl(url);
  },

  openBranchOnWeb: (branch: string) => {
    const { remoteInfo } = get();
    if (!remoteInfo?.webUrl || !branch) return;
    const cleanBranch = branch.replace(/^origin\//, '');
    const isGitLab = remoteInfo.provider === 'gitlab';
    const isBitbucket = remoteInfo.provider === 'bitbucket';
    const url = isGitLab
      ? `${remoteInfo.webUrl}/-/tree/${cleanBranch}`
      : isBitbucket
      ? `${remoteInfo.webUrl}/branch/${cleanBranch}`
      : `${remoteInfo.webUrl}/tree/${cleanBranch}`;
    get().openExternalUrl(url);
  },

  openPrOnWeb: (prNumber: number) => {
    const { remoteInfo } = get();
    if (!remoteInfo?.webUrl || !prNumber) return;
    const isGitLab = remoteInfo.provider === 'gitlab';
    const isBitbucket = remoteInfo.provider === 'bitbucket';
    const url = isGitLab
      ? `${remoteInfo.webUrl}/-/merge_requests/${prNumber}`
      : isBitbucket
      ? `${remoteInfo.webUrl}/pull-requests/${prNumber}`
      : `${remoteInfo.webUrl}/pull/${prNumber}`;
    get().openExternalUrl(url);
  },

  openIssueOnWeb: (issueNumber: number) => {
    const { remoteInfo } = get();
    if (!remoteInfo?.webUrl || !issueNumber) return;
    const isGitLab = remoteInfo.provider === 'gitlab';
    const url = isGitLab
      ? `${remoteInfo.webUrl}/-/issues/${issueNumber}`
      : `${remoteInfo.webUrl}/issues/${issueNumber}`;
    get().openExternalUrl(url);
  },
}));

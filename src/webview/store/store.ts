import { create } from 'zustand';
import type { CommitNode, BranchInfo, ChangedFile, FetchResult } from '../../extension/git-data';
import type { GraphLayout, LayoutNode } from '../components/GraphCanvas/dag-layout';
import { DAGLayoutEngine } from '../components/GraphCanvas/dag-layout';
import { BranchColorEngine } from '../../extension/color-engine';

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
  beginnerMode: boolean;
  layoutDirection: 'TB' | 'LR';
  nodeRadius: number;
  theme: 'dark' | 'light' | 'high-contrast';
  viewport: Viewport;
  isFetching: boolean;
  lastFetchResult: FetchResult | null;

  // Actions
  setGraphData: (commits: CommitNode[], branches: BranchInfo[]) => void;
  selectCommit: (hash: string | null) => void;
  setHoveredCommit: (hash: string | null) => void;
  setHighlightedBranch: (branch: string | null) => void;
  setCommitDetail: (detail: Partial<CommitFileDetail>) => void;
  setSearchQuery: (query: string) => void;
  setAuthorFilter: (authors: string[]) => void;
  setBranchFilter: (branches: string[]) => void;
  setViewMode: (mode: 'topo' | 'temporal') => void;
  setBeginnerMode: (enabled: boolean) => void;
  setLayoutDirection: (dir: 'TB' | 'LR') => void;
  setViewport: (updater: (prev: Viewport) => Viewport) => void;
  resetViewport: () => void;
  setIsFetching: (fetching: boolean, result?: FetchResult) => void;
  recomputeLayout: () => void;
}

// ─── Color & Layout Singletons ────────────────────────────────────────────────

const layoutEngine = new DAGLayoutEngine();
const colorEngine = new BranchColorEngine('dark');

export const useAppStore = create<AppState>((set, get) => ({
  commits: [],
  branches: [],
  layout: null,
  selectedHash: null,
  hoveredHash: null,
  highlightedBranch: null,
  commitDetail: null,
  searchQuery: '',
  filteredHashes: null,
  authorFilter: [],
  branchFilter: [],
  viewMode: 'topo',
  beginnerMode: true,
  layoutDirection: 'TB',
  nodeRadius: 8,
  theme: 'dark',
  viewport: { x: 50, y: 50, zoom: 1.0, width: 800, height: 600 },
  isFetching: false,
  lastFetchResult: null,

  setGraphData: (commits, branches) => {
    const { layoutDirection, viewMode, nodeRadius, theme } = get();
    colorEngine.setTheme(theme);
    const branchNames = branches.map((b) => b.name);
    const colorMap = colorEngine.getAllColors(branchNames);

    const layout = layoutEngine.layout(commits, branches, colorMap, {
      direction: layoutDirection,
      viewMode,
      nodeRadius,
    });

    set({ commits, branches, layout });
  },

  recomputeLayout: () => {
    const { commits, branches, layoutDirection, viewMode, nodeRadius, theme } = get();
    colorEngine.setTheme(theme);
    const branchNames = branches.map((b) => b.name);
    const colorMap = colorEngine.getAllColors(branchNames);

    const layout = layoutEngine.layout(commits, branches, colorMap, {
      direction: layoutDirection,
      viewMode,
      nodeRadius,
    });

    set({ layout });
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

  setCommitDetail: (detail) =>
    set((state) => ({
      commitDetail: state.commitDetail
        ? { ...state.commitDetail, ...detail }
        : null,
    })),

  setSearchQuery: (query) => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      set({ searchQuery: '', filteredHashes: null });
      return;
    }

    const { commits } = get();
    const matches = new Set<string>();

    for (const c of commits) {
      if (
        c.subject.toLowerCase().includes(trimmed) ||
        c.author.toLowerCase().includes(trimmed) ||
        c.authorEmail.toLowerCase().includes(trimmed) ||
        c.shortHash.toLowerCase().includes(trimmed) ||
        c.hash.toLowerCase().includes(trimmed) ||
        c.refs.some((r) => r.toLowerCase().includes(trimmed))
      ) {
        matches.add(c.hash);
      }
    }

    set({ searchQuery: query, filteredHashes: matches });
  },

  setAuthorFilter: (authors) => set({ authorFilter: authors }),
  setBranchFilter: (branches) => set({ branchFilter: branches }),

  setViewMode: (viewMode) => {
    set({ viewMode });
    get().recomputeLayout();
  },

  setBeginnerMode: (beginnerMode) => set({ beginnerMode }),

  setLayoutDirection: (layoutDirection) => {
    set({ layoutDirection });
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

  setIsFetching: (isFetching, lastFetchResult) =>
    set({
      isFetching,
      ...(lastFetchResult ? { lastFetchResult } : {}),
    }),
}));

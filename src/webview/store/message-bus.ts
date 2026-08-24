import type { CommitNode, BranchInfo, ChangedFile, FetchResult } from '../../extension/git-data';
import { useAppStore } from './store';

// ─── Message Definitions ───────────────────────────────────────────────────────

export type HostToWebviewMessage =
  | { type: 'GRAPH_DATA'; payload: { commits: CommitNode[]; branches: BranchInfo[] } }
  | { type: 'COMMIT_FILES_RESULT'; payload: { hash: string; files: ChangedFile[] } }
  | { type: 'DIFF_RESULT'; payload: { hash: string; filePath: string; diff: string } }
  | { type: 'FETCH_COMPLETE'; payload: FetchResult }
  | { type: 'HIGHLIGHT_BRANCH'; payload: { branch: string } }
  | { type: 'THEME_CHANGE'; payload: { theme: 'dark' | 'light' | 'high-contrast' } };

export type WebviewToHostMessage =
  | { type: 'READY' }
  | { type: 'REQUEST_GRAPH'; payload?: { maxCount?: number } }
  | { type: 'REQUEST_COMMIT_FILES'; payload: { hash: string } }
  | { type: 'REQUEST_DIFF'; payload: { hash: string; filePath: string } }
  | { type: 'OPEN_DIFF'; payload: { hash: string; filePath: string } }
  | { type: 'FETCH_ALL' }
  | { type: 'EXECUTE_OPERATION'; payload: unknown };

// ─── VS Code API Acquisition ──────────────────────────────────────────────────

interface VsCodeApi {
  postMessage: (message: WebviewToHostMessage) => void;
  setState: (state: unknown) => void;
  getState: () => unknown;
}

declare global {
  function acquireVsCodeApi(): VsCodeApi;
}

class MessageBus {
  private vscode: VsCodeApi | null = null;

  constructor() {
    try {
      if (typeof acquireVsCodeApi === 'function') {
        this.vscode = acquireVsCodeApi();
      }
    } catch {
      // Running in browser dev mode without VS Code host
      this.vscode = null;
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.handleIncomingMessage);
    }
  }

  send(message: WebviewToHostMessage): void {
    if (this.vscode) {
      this.vscode.postMessage(message);
    } else {
      // In dev mode
      console.warn('[MessageBus → Host]:', message);
    }
  }

  private handleIncomingMessage = (event: MessageEvent<HostToWebviewMessage>): void => {
    const message = event.data;
    if (!message || typeof message !== 'object') return;

    const store = useAppStore.getState();

    switch (message.type) {
      case 'GRAPH_DATA':
        store.setGraphData(message.payload.commits, message.payload.branches);
        break;

      case 'COMMIT_FILES_RESULT':
        if (store.selectedHash === message.payload.hash) {
          store.setCommitDetail({
            files: message.payload.files,
            loading: false,
          });
        }
        break;

      case 'DIFF_RESULT':
        store.setCommitDetail({
          diff: message.payload.diff,
          loading: false,
        });
        break;

      case 'FETCH_COMPLETE':
        store.setIsFetching(false, message.payload);
        break;

      case 'HIGHLIGHT_BRANCH':
        store.setHighlightedBranch(message.payload.branch);
        break;

      case 'THEME_CHANGE':
        store.setTheme(message.payload.theme);
        break;
    }
  };
}

export const messageBus = new MessageBus();

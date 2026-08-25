import * as vscode from 'vscode';
import * as path from 'path';
import type { GitDataLayer } from './git-data';
import { GitOperationExecutor, type GitOperation } from './operation-executor';

// ─── Message Protocol ─────────────────────────────────────────────────────────

type WebviewToHostMessage =
  | { type: 'READY' }
  | { type: 'REQUEST_GRAPH'; payload?: { maxCount?: number } }
  | { type: 'REQUEST_COMMIT_FILES'; payload: { hash: string } }
  | { type: 'REQUEST_DIFF'; payload: { hash: string; filePath: string } }
  | { type: 'OPEN_DIFF'; payload: { hash: string; filePath: string } }
  | { type: 'OPEN_EXTERNAL_URL'; payload: { url: string } }
  | { type: 'CREATE_PR_ON_WEB'; payload: { branch: string; baseBranch?: string } }
  | { type: 'SET_AUTO_FETCH_INTERVAL'; payload: { interval: number } }
  | { type: 'SEARCH_CHANGED_FILES'; payload: { query: string } }
  | { type: 'FETCH_ALL' }
  | { type: 'EXECUTE_OPERATION'; payload: GitOperation };

// ─── WebviewManager ───────────────────────────────────────────────────────────

export class WebviewManager {
  private panel: vscode.WebviewPanel | undefined;
  private readonly executor: GitOperationExecutor;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly gitData: GitDataLayer
  ) {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    this.executor = new GitOperationExecutor(this.gitData['git'], workspaceRoot);
  }

  openOrReveal(): void {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.One);
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'bettergitgraph.graph',
      'BetterGitGraph',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview'),
        ],
      }
    );

    this.panel.webview.html = this.getWebviewHtml(this.panel.webview);

    this.panel.webview.onDidReceiveMessage(
      async (msg: WebviewToHostMessage) => {
        switch (msg.type) {
          case 'READY': {
            const currentKind = vscode.window.activeColorTheme.kind;
            const theme =
              currentKind === vscode.ColorThemeKind.Light
                ? 'light'
                : currentKind === vscode.ColorThemeKind.HighContrast || currentKind === vscode.ColorThemeKind.HighContrastLight
                ? 'high-contrast'
                : 'dark';
            await this.panel?.webview.postMessage({
              type: 'THEME_CHANGE',
              payload: { theme },
            });
            await this.sendGraphData();
            break;
          }

          case 'REQUEST_GRAPH':
            await this.sendGraphData(msg.payload?.maxCount);
            break;

          case 'REQUEST_COMMIT_FILES': {
            const files = await this.gitData.getCommitFiles(msg.payload.hash);
            await this.panel?.webview.postMessage({
              type: 'COMMIT_FILES_RESULT',
              payload: { hash: msg.payload.hash, files },
            });
            break;
          }

          case 'FETCH_ALL': {
            const result = await this.gitData.fetchAll();
            await this.panel?.webview.postMessage({ type: 'FETCH_COMPLETE', payload: result });
            if (result.success) {
              await this.sendGraphData();
            }
            break;
          }

          case 'REQUEST_DIFF': {
            const diff = await this.gitData.getFileDiff(
              msg.payload.hash,
              msg.payload.filePath
            );
            await this.panel?.webview.postMessage({
              type: 'DIFF_RESULT',
              payload: { diff, hash: msg.payload.hash, filePath: msg.payload.filePath },
            });
            break;
          }

          case 'SEARCH_CHANGED_FILES': {
            const matchingHashes = await this.gitData.findCommitsTouchingFile(msg.payload.query);
            await this.panel?.webview.postMessage({
              type: 'SEARCH_CHANGED_FILES_RESULT',
              payload: { query: msg.payload.query, matchingHashes },
            });
            break;
          }

          case 'OPEN_DIFF': {
            const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            if (workspaceRoot && msg.payload.filePath) {
              const resolvedPath = path.resolve(workspaceRoot, msg.payload.filePath);
              // Ensure path cannot traverse outside workspace root
              if (resolvedPath.startsWith(workspaceRoot)) {
                const fileUri = vscode.Uri.file(resolvedPath);
                try {
                  await vscode.commands.executeCommand('vscode.open', fileUri);
                } catch (e) {
                  console.error('[BetterGitGraph] Failed to open file:', e);
                }
              }
            }
            break;
          }

          case 'OPEN_EXTERNAL_URL': {
            if (msg.payload.url) {
              try {
                await vscode.env.openExternal(vscode.Uri.parse(msg.payload.url));
              } catch (e) {
                console.error('[BetterGitGraph] Failed to open external URL:', e);
              }
            }
            break;
          }

          case 'CREATE_PR_ON_WEB': {
            try {
              const prUrl = await this.gitData.getPrCreateUrl(msg.payload.branch, msg.payload.baseBranch || 'main');
              if (prUrl) {
                await vscode.env.openExternal(vscode.Uri.parse(prUrl));
              }
            } catch (e) {
              console.error('[BetterGitGraph] Failed to open PR create URL:', e);
            }
            break;
          }

          case 'SET_AUTO_FETCH_INTERVAL': {
            try {
              const config = vscode.workspace.getConfiguration('bettergitgraph');
              await config.update('autoFetchInterval', msg.payload.interval, vscode.ConfigurationTarget.Global);
            } catch (e) {
              console.error('[BetterGitGraph] Failed to update autoFetchInterval:', e);
            }
            break;
          }

          case 'EXECUTE_OPERATION': {
            const result = await this.executor.execute(msg.payload);
            await this.panel?.webview.postMessage({
              type: 'OPERATION_RESULT',
              payload: result,
            });

            if (result.success) {
              vscode.window.showInformationMessage(result.message);
              await this.sendGraphData();
            } else if (result.error !== 'CONFIRMATION_REQUIRED') {
              vscode.window.showErrorMessage(result.message);
            }
            break;
          }
        }
      },
      undefined,
      this.context.subscriptions
    );

    vscode.workspace.onDidChangeConfiguration(
      (e) => {
        if (
          e.affectsConfiguration('bettergitgraph.autoFetchInterval') ||
          e.affectsConfiguration('bettergitgraph.twoStageConfirmation') ||
          e.affectsConfiguration('bettergitgraph.mainTrunkStrokeWidth') ||
          e.affectsConfiguration('bettergitgraph.branchStrokeWidth')
        ) {
          void this.sendGraphData();
        }
      },
      undefined,
      this.context.subscriptions
    );

    vscode.window.onDidChangeActiveColorTheme(
      (theme) => {
        if (!this.panel) return;
        const themeKind =
          theme.kind === vscode.ColorThemeKind.Light
            ? 'light'
            : theme.kind === vscode.ColorThemeKind.HighContrast || theme.kind === vscode.ColorThemeKind.HighContrastLight
            ? 'high-contrast'
            : 'dark';
        this.panel.webview.postMessage({
          type: 'THEME_CHANGE',
          payload: { theme: themeKind },
        });
      },
      undefined,
      this.context.subscriptions
    );

    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });
  }

  async refresh(): Promise<void> {
    if (this.panel) {
      await this.sendGraphData();
    }
  }

  dispose(): void {
    this.panel?.dispose();
  }

  private async sendGraphData(maxCount?: number): Promise<void> {
    if (!this.panel) return;
    const [graph, branches, remoteInfo, workingTreeStatus, branchSyncStatus, stashes] = await Promise.all([
      this.gitData.getCommitGraph(maxCount !== undefined ? { maxCount } : undefined),
      this.gitData.getAllBranches(),
      this.gitData.getRemoteRepoInfo(),
      this.gitData.getWorkingTreeStatus(),
      this.gitData.getBranchSyncStatus(),
      this.gitData.getStashes(),
    ]);
    const config = vscode.workspace.getConfiguration('bettergitgraph');
    const autoFetchInterval = config.get<number>('autoFetchInterval', 0);
    const twoStageConfirmation = config.get<boolean>('twoStageConfirmation', true);
    const mainTrunkStrokeWidth = config.get<number>('mainTrunkStrokeWidth', 7);
    const branchStrokeWidth = config.get<number>('branchStrokeWidth', 3);
    const repoName = path.basename(this.gitData.repoRoot) || 'Repository';

    await this.panel.webview.postMessage({
      type: 'GRAPH_DATA',
      payload: {
        commits: graph.commits,
        edges: graph.edges,
        branches,
        remoteInfo,
        autoFetchInterval,
        repoName,
        workingTreeStatus,
        branchSyncStatus,
        stashes,
        twoStageConfirmation,
        mainTrunkStrokeWidth,
        branchStrokeWidth,
      },
    });
  }

  private getWebviewHtml(webview: vscode.Webview): string {
    const distWebviewUri = vscode.Uri.joinPath(
      this.context.extensionUri,
      'dist',
      'webview'
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(distWebviewUri, 'main.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(distWebviewUri, 'main.css')
    );
    const nonce = getNonce();

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'none';
    style-src ${webview.cspSource} 'unsafe-inline';
    script-src 'nonce-${nonce}';
    img-src ${webview.cspSource} data:;
    font-src ${webview.cspSource};
  "/>
  <title>BetterGitGraph</title>
  <link rel="stylesheet" href="${styleUri}" />
</head>
<body style="margin: 0; padding: 0; overflow: hidden; background: var(--vscode-editor-background, #1e1e1e);">
  <div id="root"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

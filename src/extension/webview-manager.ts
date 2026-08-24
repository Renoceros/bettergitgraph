import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import type { GitDataLayer } from './git-data';

// ─── Message Protocol ─────────────────────────────────────────────────────────

type WebviewToHostMessage =
  | { type: 'READY' }
  | { type: 'REQUEST_GRAPH'; payload?: { maxCount?: number } }
  | { type: 'FETCH_ALL' }
  | { type: 'REQUEST_DIFF'; payload: { hash: string; filePath: string } };

// ─── WebviewManager ───────────────────────────────────────────────────────────

export class WebviewManager {
  private panel: vscode.WebviewPanel | undefined;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly gitData: GitDataLayer
  ) {}

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
          case 'READY':
            await this.sendGraphData();
            break;
          case 'REQUEST_GRAPH':
            await this.sendGraphData(msg.payload?.maxCount);
            break;
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
        }
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
    const [graph, branches] = await Promise.all([
      this.gitData.getCommitGraph({ maxCount }),
      this.gitData.getAllBranches(),
    ]);
    await this.panel.webview.postMessage({
      type: 'GRAPH_DATA',
      payload: { commits: graph.commits, edges: graph.edges, branches },
    });
  }

  private getWebviewHtml(webview: vscode.Webview): string {
    // During development, the webview assets are served from dist/webview
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
    style-src ${webview.cspSource} 'nonce-${nonce}';
    script-src 'nonce-${nonce}';
    img-src ${webview.cspSource} data:;
    font-src ${webview.cspSource};
  "/>
  <title>BetterGitGraph</title>
  <link rel="stylesheet" href="${styleUri}" />
</head>
<body>
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

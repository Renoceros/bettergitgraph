import * as vscode from 'vscode';
import simpleGit from 'simple-git';
import { WebviewManager } from './webview-manager';
import { GitDataLayer } from './git-data';
import { BranchExplorerProvider } from './branch-explorer';

let webviewManager: WebviewManager | undefined;

export function activate(context: vscode.ExtensionContext): void {
  console.warn('[BetterGitGraph] Extension activating…');

  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) {
    return;
  }

  const git = simpleGit(workspaceRoot);
  const gitData = new GitDataLayer(git, workspaceRoot);
  webviewManager = new WebviewManager(context, gitData);

  // Register: Open Graph command
  context.subscriptions.push(
    vscode.commands.registerCommand('bettergitgraph.open', () => {
      webviewManager?.openOrReveal();
    })
  );

  // Register: Fetch All command
  context.subscriptions.push(
    vscode.commands.registerCommand('bettergitgraph.fetchAll', async () => {
      await gitData.fetchAll();
      webviewManager?.refresh();
    })
  );

  // Register: Branch Explorer tree view
  const branchExplorer = new BranchExplorerProvider(gitData);
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      'bettergitgraph.branchExplorer',
      branchExplorer
    )
  );

  // Auto-refresh when git HEAD changes
  const watcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(workspaceRoot, '.git/HEAD')
  );
  watcher.onDidChange(() => {
    webviewManager?.refresh();
    branchExplorer.refresh();
  });
  context.subscriptions.push(watcher);

  console.warn('[BetterGitGraph] Extension activated.');
}

export function deactivate(): void {
  webviewManager?.dispose();
}

import * as vscode from 'vscode';
import type { GitDataLayer, BranchInfo } from './git-data';

// ─── Tree Item Types ───────────────────────────────────────────────────────────

type BranchTreeItemKind =
  | 'category'      // LOCAL / REMOTES / TAGS / STASHES
  | 'remote'        // origin, upstream …
  | 'remotePath'    // feature, feature/auth (intermediate path segments)
  | 'branch'        // actual branch leaf
  | 'tag'
  | 'stash';

class BranchTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly kind: BranchTreeItemKind,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly branchInfo?: BranchInfo,
    public readonly children?: BranchTreeItem[]
  ) {
    super(label, collapsibleState);

    switch (kind) {
      case 'category':
        this.contextValue = 'category';
        this.iconPath = new vscode.ThemeIcon('folder');
        break;
      case 'branch':
        this.contextValue = 'branch';
        this.iconPath = new vscode.ThemeIcon(
          branchInfo?.isHead ? 'circle-filled' : 'git-branch'
        );
        if (branchInfo?.isHead) {
          this.description = '● HEAD';
        } else if (branchInfo && (branchInfo.aheadCount > 0 || branchInfo.behindCount > 0)) {
          const parts: string[] = [];
          if (branchInfo.aheadCount > 0) parts.push(`↑${branchInfo.aheadCount}`);
          if (branchInfo.behindCount > 0) parts.push(`↓${branchInfo.behindCount}`);
          this.description = parts.join(' ');
        }
        break;
      case 'remote':
        this.contextValue = 'remote';
        this.iconPath = new vscode.ThemeIcon('cloud');
        break;
      case 'remotePath':
        this.contextValue = 'remotePath';
        this.iconPath = new vscode.ThemeIcon('folder');
        break;
      case 'tag':
        this.contextValue = 'tag';
        this.iconPath = new vscode.ThemeIcon('tag');
        break;
      case 'stash':
        this.contextValue = 'stash';
        this.iconPath = new vscode.ThemeIcon('archive');
        break;
    }
  }
}

// ─── BranchExplorerProvider ───────────────────────────────────────────────────

export class BranchExplorerProvider
  implements vscode.TreeDataProvider<BranchTreeItem>
{
  private _onDidChangeTreeData = new vscode.EventEmitter<
    BranchTreeItem | undefined | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private readonly gitData: GitDataLayer) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: BranchTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: BranchTreeItem): Promise<BranchTreeItem[]> {
    if (!element) {
      // Root: return category nodes
      return [
        new BranchTreeItem('LOCAL', 'category', vscode.TreeItemCollapsibleState.Expanded),
        new BranchTreeItem('REMOTES', 'category', vscode.TreeItemCollapsibleState.Expanded),
        new BranchTreeItem('TAGS', 'category', vscode.TreeItemCollapsibleState.Collapsed),
        new BranchTreeItem('STASHES', 'category', vscode.TreeItemCollapsibleState.Collapsed),
      ];
    }

    if (element.kind === 'category') {
      return this.getCategoryChildren(element.label);
    }

    if (element.kind === 'remote' || element.kind === 'remotePath') {
      return element.children ?? [];
    }

    return [];
  }

  private async getCategoryChildren(category: string): Promise<BranchTreeItem[]> {
    switch (category) {
      case 'LOCAL': {
        const branches = await this.gitData.getAllBranches();
        return branches
          .filter((b) => !b.isRemote)
          .map(
            (b) =>
              new BranchTreeItem(
                b.name,
                'branch',
                vscode.TreeItemCollapsibleState.None,
                b
              )
          );
      }

      case 'REMOTES': {
        const branches = await this.gitData.getAllBranches();
        const remoteBranches = branches.filter((b) => b.isRemote);
        return buildRemoteTree(remoteBranches);
      }

      case 'TAGS': {
        const tags = await this.gitData.getTags();
        return tags.map(
          (t) =>
            new BranchTreeItem(t.name, 'tag', vscode.TreeItemCollapsibleState.None)
        );
      }

      case 'STASHES': {
        const stashes = await this.gitData.getStashes();
        return stashes.map(
          (s) =>
            new BranchTreeItem(
              `stash@{${s.index}}: ${s.message}`,
              'stash',
              vscode.TreeItemCollapsibleState.None
            )
        );
      }

      default:
        return [];
    }
  }
}

// ─── Remote Tree Builder ───────────────────────────────────────────────────────

/**
 * Converts a flat list of remote branches into a nested tree.
 * e.g. ["origin/feature/auth", "origin/main"] →
 *   origin
 *     feature
 *       auth
 *     main
 */
function buildRemoteTree(branches: BranchInfo[]): BranchTreeItem[] {
  // Group by remote name (first segment)
  const remoteMap = new Map<string, string[]>();
  for (const b of branches) {
    const segments = b.name.split('/');
    const remote = segments[0] ?? 'origin';
    const rest = segments.slice(1).join('/');
    if (!remoteMap.has(remote)) remoteMap.set(remote, []);
    remoteMap.get(remote)!.push(rest);
  }

  return Array.from(remoteMap.entries()).map(([remote, refs]) => {
    const children = buildPathTree(refs, 'branch');
    return new BranchTreeItem(
      remote,
      'remote',
      vscode.TreeItemCollapsibleState.Expanded,
      undefined,
      children
    );
  });
}

function buildPathTree(
  paths: string[],
  leafKind: BranchTreeItemKind
): BranchTreeItem[] {
  const nodeMap = new Map<string, string[]>();

  for (const p of paths) {
    const segments = p.split('/');
    const head = segments[0] ?? p;
    const tail = segments.slice(1).join('/');
    if (!nodeMap.has(head)) nodeMap.set(head, []);
    if (tail) nodeMap.get(head)!.push(tail);
  }

  return Array.from(nodeMap.entries()).map(([name, children]) => {
    if (children.length === 0) {
      return new BranchTreeItem(name, leafKind, vscode.TreeItemCollapsibleState.None);
    }
    const childItems = buildPathTree(children, leafKind);
    return new BranchTreeItem(
      name,
      'remotePath',
      vscode.TreeItemCollapsibleState.Collapsed,
      undefined,
      childItems
    );
  });
}

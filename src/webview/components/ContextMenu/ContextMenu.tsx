import React, { useEffect, useRef } from 'react';
import type { LayoutNode } from '../GraphCanvas/dag-layout';
import type { GitOperation } from '../../../extension/operation-executor';
import { useAppStore } from '../../store/store';
import {
  IconCheckout,
  IconBranch,
  IconRevert,
  IconCherryPick,
  IconTag,
  IconReset,
  IconDanger,
  IconCopy,
  IconExternalLink,
  IconSync,
} from '../Icons/Icons';

export interface ContextMenuProps {
  x: number;
  y: number;
  node: LayoutNode;
  beginnerMode: boolean;
  onSelectOperation: (op: GitOperation, requiresConfirm?: boolean) => void;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  node,
  beginnerMode,
  onSelectOperation,
  onClose,
}) => {
  const {
    remoteInfo,
    openCommitOnWeb,
    openBranchOnWeb,
    openPrOnWeb,
    openIssueOnWeb,
    openPrCreateOnWeb,
  } = useAppStore();
  const providerName =
    remoteInfo?.provider === 'github'
      ? 'GitHub'
      : remoteInfo?.provider === 'gitlab'
      ? 'GitLab'
      : remoteInfo?.provider === 'bitbucket'
      ? 'Bitbucket'
      : remoteInfo?.provider === 'azure'
      ? 'Azure'
      : 'Remote';

  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleAction = (op: GitOperation, requiresConfirm = false) => {
    onSelectOperation(op, requiresConfirm);
    onClose();
  };

  const handleCreateBranchPrompt = () => {
    const branchName = window.prompt('Enter new branch name:');
    if (branchName?.trim()) {
      handleAction({ op: 'CREATE_BRANCH', name: branchName.trim(), hash: node.hash }, false);
    }
  };

  const handleTagPrompt = () => {
    const tagName = window.prompt('Enter tag name:');
    if (tagName?.trim()) {
      handleAction({ op: 'TAG', name: tagName.trim(), hash: node.hash }, false);
    }
  };

  const adjustedX = Math.min(x, window.innerWidth - 280);
  const adjustedY = Math.min(y, window.innerHeight - 380);

  return (
    <div
      ref={menuRef}
      role="menu"
      style={{
        position: 'fixed',
        left: adjustedX,
        top: adjustedY,
        width: 270,
        backgroundColor: 'var(--vscode-menu-background, #252526)',
        color: 'var(--vscode-menu-foreground, #cccccc)',
        border: '1px solid var(--vscode-menu-border, #454545)',
        borderRadius: 6,
        boxShadow: '0 6px 18px rgba(0,0,0,0.4)',
        padding: '6px 0',
        zIndex: 1000,
        fontSize: 12,
        userSelect: 'none',
      }}
    >
      <div
        style={{
          padding: '6px 12px',
          fontSize: 11,
          fontWeight: 'bold',
          opacity: 0.6,
          borderBottom: '1px solid var(--vscode-menu-separatorBackground, #3c3c3c)',
          marginBottom: 4,
        }}
      >
        Commit {node.shortHash}
      </div>

      <MenuItem
        icon={<IconCheckout size={14} color="#4ec9b0" />}
        title="Checkout this commit"
        beginnerSubtitle="Go to this point in time"
        gitCommand={`git checkout ${node.shortHash}`}
        beginnerMode={beginnerMode}
        onClick={() => handleAction({ op: 'CHECKOUT', hash: node.hash }, false)}
      />

      <MenuItem
        icon={<IconBranch size={14} color="#569cd6" />}
        title="Create branch here…"
        beginnerSubtitle="Start a new branch from here"
        gitCommand={`git branch <name> ${node.shortHash}`}
        beginnerMode={beginnerMode}
        onClick={handleCreateBranchPrompt}
      />

      <MenuItem
        icon={<IconRevert size={14} color="#dcdcaa" />}
        title="Revert this commit"
        beginnerSubtitle="Create a commit that undoes this change"
        gitCommand={`git revert ${node.shortHash}`}
        beginnerMode={beginnerMode}
        onClick={() => handleAction({ op: 'REVERT', hash: node.hash }, beginnerMode)}
      />

      <MenuItem
        icon={<IconCherryPick size={14} color="#ce9178" />}
        title="Cherry-pick this commit"
        beginnerSubtitle="Copy this commit to current branch"
        gitCommand={`git cherry-pick ${node.shortHash}`}
        beginnerMode={beginnerMode}
        onClick={() => handleAction({ op: 'CHERRY_PICK', hash: node.hash }, beginnerMode)}
      />

      <MenuItem
        icon={<IconTag size={14} color="#e5a50a" />}
        title="Tag this commit…"
        beginnerSubtitle="Add a permanent name bookmark"
        gitCommand={`git tag <name> ${node.shortHash}`}
        beginnerMode={beginnerMode}
        onClick={handleTagPrompt}
      />

      <div style={{ height: 1, backgroundColor: 'var(--vscode-menu-separatorBackground, #3c3c3c)', margin: '4px 0' }} />

      <MenuItem
        icon={<IconReset size={14} color="#e5a50a" />}
        title="Reset branch to here (Soft)"
        beginnerSubtitle="Move branch pointer, keep changes staged"
        gitCommand={`git reset --soft ${node.shortHash}`}
        beginnerMode={beginnerMode}
        onClick={() => handleAction({ op: 'RESET', mode: 'soft', hash: node.hash }, beginnerMode)}
      />

      <MenuItem
        icon={<IconReset size={14} color="#e5a50a" />}
        title="Reset branch to here (Mixed)"
        beginnerSubtitle="Move pointer, keep changes unstaged"
        gitCommand={`git reset --mixed ${node.shortHash}`}
        beginnerMode={beginnerMode}
        onClick={() => handleAction({ op: 'RESET', mode: 'mixed', hash: node.hash }, beginnerMode)}
      />

      <MenuItem
        icon={<IconDanger size={14} color="#f14c4c" />}
        title="Reset branch to here (Hard)"
        beginnerSubtitle="DISCARD all uncommitted changes"
        gitCommand={`git reset --hard ${node.shortHash}`}
        beginnerMode={beginnerMode}
        danger
        onClick={() => handleAction({ op: 'RESET', mode: 'hard', hash: node.hash }, true)}
      />

      <div style={{ height: 1, backgroundColor: 'var(--vscode-menu-separatorBackground, #3c3c3c)', margin: '4px 0' }} />

      {remoteInfo && (
        <>
          <MenuItem
            icon={<IconExternalLink size={14} color="#4ec9b0" />}
            title={`Raise PR / Create MR (${node.branchName})`}
            beginnerSubtitle={`Create a Pull Request on ${providerName}`}
            gitCommand={`Create PR: ${node.branchName} → main`}
            beginnerMode={beginnerMode}
            onClick={() => {
              openPrCreateOnWeb(node.branchName);
              onClose();
            }}
          />
          <MenuItem
            icon={<IconSync size={14} color="#569cd6" />}
            title="Sync (Pull & Push)"
            beginnerSubtitle="Fetch changes and push current branch"
            gitCommand="git pull && git push"
            beginnerMode={beginnerMode}
            onClick={() => handleAction({ op: 'SYNC' }, false)}
          />
          <MenuItem
            icon={<IconExternalLink size={14} color="#4ec9b0" />}
            title={
              node.nodeType === 'pr' && node.prNumber
                ? `Open PR #${node.prNumber} on ${providerName}`
                : node.nodeType === 'issue' && node.issueNumber
                ? `Open Issue #${node.issueNumber} on ${providerName}`
                : `Open Commit on ${providerName}`
            }
            beginnerSubtitle="View this revision in your web browser"
            gitCommand={remoteInfo.webUrl}
            beginnerMode={beginnerMode}
            onClick={() => {
              if (node.nodeType === 'pr' && node.prNumber) {
                openPrOnWeb(node.prNumber);
              } else if (node.nodeType === 'issue' && node.issueNumber) {
                openIssueOnWeb(node.issueNumber);
              } else {
                openCommitOnWeb(node.hash);
              }
              onClose();
            }}
          />
          <MenuItem
            icon={<IconBranch size={14} color="#569cd6" />}
            title={`Open Branch '${node.branchName}' on ${providerName}`}
            beginnerSubtitle="View branch tree in your web browser"
            gitCommand={`${remoteInfo.webUrl}/tree/${node.branchName}`}
            beginnerMode={beginnerMode}
            onClick={() => {
              openBranchOnWeb(node.branchName);
              onClose();
            }}
          />
          <div style={{ height: 1, backgroundColor: 'var(--vscode-menu-separatorBackground, #3c3c3c)', margin: '4px 0' }} />
        </>
      )}

      <MenuItem
        icon={<IconCopy size={14} color="currentColor" />}
        title="Copy Commit SHA"
        gitCommand={node.hash}
        beginnerMode={false}
        onClick={() => {
          navigator.clipboard.writeText(node.hash);
          onClose();
        }}
      />
    </div>
  );
};

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  beginnerSubtitle?: string;
  gitCommand: string;
  beginnerMode: boolean;
  danger?: boolean;
  onClick: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  title,
  beginnerSubtitle,
  gitCommand,
  beginnerMode,
  danger,
  onClick,
}) => {
  return (
    <div
      role="menuitem"
      onClick={onClick}
      style={{
        padding: '6px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        cursor: 'pointer',
        color: danger ? '#f14c4c' : 'inherit',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = danger
          ? 'rgba(241, 76, 76, 0.2)'
          : 'var(--vscode-menu-selectionBackground, #04395e)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16 }}>
          {icon}
        </span>
        <span style={{ fontWeight: 500 }}>{title}</span>
      </div>
      {beginnerMode && beginnerSubtitle && (
        <span style={{ fontSize: 10, opacity: 0.7, paddingLeft: 26 }}>
          {beginnerSubtitle}
        </span>
      )}
      <span
        style={{
          fontSize: 10,
          fontFamily: 'monospace',
          opacity: 0.5,
          paddingLeft: 26,
        }}
      >
        {gitCommand}
      </span>
    </div>
  );
};

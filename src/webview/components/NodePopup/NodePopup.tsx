import React, { useState } from 'react';
import type { LayoutNode } from '../GraphCanvas/dag-layout';
import type { ChangedFile } from '../../../extension/git-data';
import type { GitOperation } from '../../../extension/operation-executor';
import { useAppStore } from '../../store/store';
import { FileList } from '../CommitDetail/FileList';
import {
  IconCheckout,
  IconBranch,
  IconRevert,
  IconReset,
  IconCopy,
  IconCheck,
  IconExternalLink,
} from '../Icons/Icons';

export interface NodePopupProps {
  node: LayoutNode;
  files: ChangedFile[];
  loadingFiles: boolean;
  screenX: number;
  screenY: number;
  onSelectParent: (hash: string) => void;
  onExecuteOperation: (op: GitOperation, requiresConfirm?: boolean) => void;
  onClose: () => void;
}

export const NodePopup: React.FC<NodePopupProps> = ({
  node,
  files,
  loadingFiles,
  screenX,
  screenY,
  onSelectParent,
  onExecuteOperation,
  onClose,
}) => {
  const {
    remoteInfo,
    openCommitOnWeb,
    openPrOnWeb,
    openIssueOnWeb,
    openPrCreateOnWeb,
  } = useAppStore();
  const [copied, setCopied] = useState(false);

  const handleCopyHash = () => {
    navigator.clipboard.writeText(node.hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = new Date(node.date).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const popupWidth = 360;
  const popupHeight = 460;
  const left = Math.max(16, Math.min(screenX + 20, window.innerWidth - popupWidth - 16));
  const top = Math.max(50, Math.min(screenY - 40, window.innerHeight - popupHeight - 16));

  return (
    <div
      role="dialog"
      style={{
        position: 'fixed',
        left,
        top,
        width: popupWidth,
        maxHeight: 'min(460px, calc(100vh - 70px))',
        backgroundColor: 'var(--vscode-editorWidget-background, #252526)',
        color: 'var(--vscode-foreground, #cccccc)',
        border: '1px solid var(--vscode-editorWidget-border, #454545)',
        borderRadius: 8,
        boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
        zIndex: 1500,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontSize: 12,
        userSelect: 'none',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Popup Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 14px',
          borderBottom: '1px solid var(--vscode-editorWidget-border, #3c3c3c)',
          backgroundColor: 'var(--vscode-titleBar-activeBackground, #1e1e1e)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 'bold',
              backgroundColor:
                node.nodeType === 'pr'
                  ? 'rgba(137, 87, 229, 0.25)'
                  : node.nodeType === 'issue'
                  ? 'rgba(35, 134, 54, 0.25)'
                  : node.isMainBranch
                  ? 'rgba(78,201,176,0.2)'
                  : 'rgba(86,156,214,0.2)',
              color:
                node.nodeType === 'pr'
                  ? '#d8b4fe'
                  : node.nodeType === 'issue'
                  ? '#4ade80'
                  : node.isMainBranch
                  ? '#34d399'
                  : '#60a5fa',
              border: `1px solid ${
                node.nodeType === 'pr'
                  ? '#8957e5'
                  : node.nodeType === 'issue'
                  ? '#238636'
                  : node.isMainBranch
                  ? '#4ec9b0'
                  : '#569cd6'
              }`,
            }}
          >
            {node.nodeType === 'pr'
              ? node.prNumber
                ? `PR #${node.prNumber}`
                : 'PULL REQUEST'
              : node.nodeType === 'issue'
              ? node.issueNumber
                ? `ISSUE #${node.issueNumber}`
                : 'ISSUE'
              : node.nodeType.toUpperCase()}
          </span>
          <span style={{ fontWeight: 600 }}>{node.branchName}</span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--vscode-foreground)',
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: 1,
            padding: 2,
          }}
        >
          ✕
        </button>
      </div>

      {/* Body Content */}
      <div style={{ padding: 14, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Title */}
        <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.4, color: 'var(--vscode-foreground)' }}>
          {node.subject}
        </div>

        {/* Metadata */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            fontSize: 11,
            backgroundColor: 'rgba(0,0,0,0.15)',
            padding: 8,
            borderRadius: 6,
          }}
        >
          <div>
            <strong>Author:</strong> {node.author} &lt;{node.authorEmail}&gt;
          </div>
          <div>
            <strong>Date:</strong> {formattedDate} ({node.relativeTime})
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <strong>SHA:</strong>
            <button
              onClick={handleCopyHash}
              style={{
                background: 'none',
                border: '1px solid #555',
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: 11,
                fontFamily: 'monospace',
                color: 'var(--vscode-foreground)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {copied ? (
                <>
                  <IconCheck size={11} color="#4ec9b0" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <IconCopy size={11} />
                  <span>{node.shortHash}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Parent Commits Navigation */}
        {node.parents.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.7, marginBottom: 4 }}>
              Parents ({node.parents.length})
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {node.parents.map((parentHash) => (
                <button
                  key={parentHash}
                  onClick={() => onSelectParent(parentHash)}
                  style={{
                    background: 'var(--vscode-badge-background, #4d4d4d)',
                    color: 'var(--vscode-badge-foreground, #ffffff)',
                    border: 'none',
                    borderRadius: 4,
                    padding: '2px 8px',
                    fontSize: 11,
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                  }}
                >
                  {parentHash.slice(0, 8)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Changed Files */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.7 }}>
            Changed Files
          </div>
          <FileList hash={node.hash} files={files} loading={loadingFiles} />
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
            paddingTop: 8,
            borderTop: '1px solid var(--vscode-editorWidget-border, #3c3c3c)',
          }}
        >
          <button
            onClick={() => onExecuteOperation({ op: 'CHECKOUT', hash: node.hash })}
            style={actionBtnStyle}
          >
            <IconCheckout size={12} color="#4ec9b0" />
            <span>Checkout</span>
          </button>
          <button
            onClick={() => {
              const branchName = window.prompt('New branch name:');
              if (branchName?.trim()) {
                onExecuteOperation({ op: 'CREATE_BRANCH', name: branchName.trim(), hash: node.hash });
              }
            }}
            style={actionBtnStyle}
          >
            <IconBranch size={12} color="#569cd6" />
            <span>Branch</span>
          </button>
          <button
            onClick={() => onExecuteOperation({ op: 'REVERT', hash: node.hash }, true)}
            style={actionBtnStyle}
          >
            <IconRevert size={12} color="#dcdcaa" />
            <span>Revert</span>
          </button>
          <button
            onClick={() => onExecuteOperation({ op: 'RESET', mode: 'hard', hash: node.hash }, true)}
            style={{ ...actionBtnStyle, color: '#f14c4c', borderColor: '#f14c4c' }}
          >
            <IconReset size={12} color="#f14c4c" />
            <span>Reset Hard</span>
          </button>
          {remoteInfo && (
            <>
              <button
                onClick={() => openPrCreateOnWeb(node.branchName)}
                title={`Raise PR for ${node.branchName}`}
                style={{
                  ...actionBtnStyle,
                  color: '#4ec9b0',
                  borderColor: '#4ec9b0',
                  backgroundColor: 'rgba(78, 201, 176, 0.12)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <IconExternalLink size={12} color="#4ec9b0" />
                <span>Raise PR</span>
              </button>
              <button
                onClick={() => {
                  if (node.nodeType === 'pr' && node.prNumber) {
                    openPrOnWeb(node.prNumber);
                  } else if (node.nodeType === 'issue' && node.issueNumber) {
                    openIssueOnWeb(node.issueNumber);
                  } else {
                    openCommitOnWeb(node.hash);
                  }
                }}
                title="Open in web browser"
                style={{
                  ...actionBtnStyle,
                  color: '#569cd6',
                  borderColor: '#569cd6',
                  backgroundColor: 'rgba(86, 156, 214, 0.1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <IconExternalLink size={12} color="#569cd6" />
                <span>
                  {node.nodeType === 'pr' && node.prNumber
                    ? `PR #${node.prNumber}`
                    : node.nodeType === 'issue' && node.issueNumber
                    ? `Issue #${node.issueNumber}`
                    : `Open on Web`}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const actionBtnStyle: React.CSSProperties = {
  backgroundColor: 'var(--vscode-button-secondaryBackground, #3a3d41)',
  color: 'var(--vscode-button-secondaryForeground, #ffffff)',
  border: '1px solid var(--vscode-button-secondaryBorder, #454545)',
  borderRadius: 4,
  padding: '4px 10px',
  cursor: 'pointer',
  fontSize: 11,
  fontWeight: 500,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

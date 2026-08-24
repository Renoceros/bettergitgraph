import React, { useState } from 'react';
import { useAppStore } from '../../store/store';
import { FileList } from './FileList';

export const CommitDetail: React.FC = () => {
  const { selectedHash, layout, commitDetail, selectCommit } = useAppStore();
  const [copied, setCopied] = useState(false);

  if (!selectedHash || !layout) return null;

  const node = layout.nodeMap.get(selectedHash);
  if (!node) return null;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(node.hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = new Date(node.date).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <aside
      style={{
        width: 340,
        height: '100%',
        backgroundColor: 'var(--vscode-sideBar-background, #252526)',
        borderLeft: '1px solid var(--vscode-sideBar-border, #333333)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        boxSizing: 'border-box',
        color: 'var(--vscode-foreground, #cccccc)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid var(--vscode-sideBar-border, #333333)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 'bold', fontSize: 13 }}>Commit</span>
          <button
            onClick={handleCopyHash}
            title="Copy full SHA"
            style={{
              background: 'none',
              border: '1px solid var(--vscode-button-secondaryBorder, #454545)',
              borderRadius: 4,
              padding: '2px 6px',
              fontSize: 11,
              fontFamily: 'monospace',
              color: 'var(--vscode-foreground)',
              cursor: 'pointer',
            }}
          >
            {copied ? '✓ Copied' : node.shortHash}
          </button>
        </div>
        <button
          onClick={() => selectCommit(null)}
          title="Close details"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--vscode-foreground)',
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: 1,
            padding: 4,
          }}
        >
          ✕
        </button>
      </div>

      {/* Commit Info Content */}
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Subject */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4, color: 'var(--vscode-foreground)' }}>
            {node.subject}
          </div>
        </div>

        {/* Author & Date */}
        <div style={{ fontSize: 12, opacity: 0.85, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div>
            <strong>Author:</strong> {node.author} &lt;{node.authorEmail}&gt;
          </div>
          <div>
            <strong>Date:</strong> {formattedDate}
          </div>
          <div>
            <strong>Branch:</strong> <span style={{ color: node.branchColor, fontWeight: 'bold' }}>{node.branchName}</span>
          </div>
        </div>

        {/* Parent Commits */}
        {node.parents.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.7, marginBottom: 4 }}>
              Parents ({node.parents.length})
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {node.parents.map((parentHash) => {
                const parentNode = layout.nodeMap.get(parentHash);
                return (
                  <button
                    key={parentHash}
                    onClick={() => selectCommit(parentHash)}
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
                    {parentNode?.shortHash || parentHash.slice(0, 8)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Changed Files */}
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.7 }}>
            Changed Files
          </div>
          <FileList
            hash={node.hash}
            files={commitDetail?.files ?? []}
            loading={commitDetail?.loading ?? false}
          />
        </div>
      </div>
    </aside>
  );
};

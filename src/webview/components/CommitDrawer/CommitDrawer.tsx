import React, { useState } from 'react';
import { useAppStore } from '../../store/store';
import { messageBus } from '../../store/message-bus';

export const CommitDrawer: React.FC = () => {
  const {
    isCommitDrawerOpen,
    setCommitDrawerOpen,
    workingTreeStatus,
    stageFile,
    unstageFile,
    stageAll,
    unstageAll,
    discardFile,
    commitChanges,
    commitAmend,
    theme,
  } = useAppStore();

  const [commitMsg, setCommitMsg] = useState('');
  const [isAmend, setIsAmend] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCommitDrawerOpen) return null;

  const isDark = theme !== 'light';
  const staged = workingTreeStatus?.staged ?? [];
  const unstaged = workingTreeStatus?.unstaged ?? [];
  const untracked = workingTreeStatus?.untracked ?? [];
  const allUnstaged = [...unstaged, ...untracked];

  const handleCommit = (push = false) => {
    if (!commitMsg.trim() && !isAmend) return;
    setIsSubmitting(true);
    if (isAmend) {
      commitAmend(commitMsg.trim() || undefined);
    } else {
      commitChanges(commitMsg.trim(), push);
    }
    setCommitMsg('');
    setIsAmend(false);
    setIsSubmitting(false);
    setCommitDrawerOpen(false);
  };

  const handleConventionalPrefix = (prefix: string) => {
    if (commitMsg.startsWith(prefix)) return;
    setCommitMsg(`${prefix}${commitMsg.replace(/^[a-z]+(\([a-z0-9_-]+\))?:\s*/i, '')}`);
  };

  const handleOpenFile = (filePath: string) => {
    messageBus.send({
      type: 'OPEN_DIFF',
      payload: { hash: 'HEAD', filePath },
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1500,
        display: 'flex',
        justifyContent: 'flex-end',
        backdropFilter: 'blur(2px)',
      }}
      onClick={() => setCommitDrawerOpen(false)}
    >
      <div
        style={{
          width: 440,
          maxWidth: '90vw',
          height: '100%',
          backgroundColor: 'var(--vscode-editorWidget-background, #252526)',
          borderLeft: '1px solid var(--vscode-editorWidget-border, #3c3c3c)',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          color: 'var(--vscode-foreground, #cccccc)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--vscode-editorWidget-border, #3c3c3c)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: isDark ? '#1f1f20' : '#f3f4f6',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#4ec9b0' }}>
              Commit & Staging Studio
            </h3>
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
              {staged.length} staged, {allUnstaged.length} unstaged changes
            </div>
          </div>
          <button
            onClick={() => setCommitDrawerOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: 16,
              padding: '4px 8px',
              borderRadius: 4,
              opacity: 0.7,
            }}
            title="Close Drawer (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Scrollable File Staging Section */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Staged Files */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', color: '#4ec9b0' }}>
                Staged Changes ({staged.length})
              </span>
              {staged.length > 0 && (
                <button
                  onClick={unstageAll}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--vscode-textLink-foreground, #3794ff)',
                    cursor: 'pointer',
                    fontSize: 11,
                    padding: 0,
                  }}
                >
                  Unstage All
                </button>
              )}
            </div>

            {staged.length === 0 ? (
              <div style={{ fontSize: 12, opacity: 0.5, fontStyle: 'italic', padding: '6px 0' }}>
                No staged changes. Check files below to stage them.
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                  borderRadius: 6,
                  padding: 4,
                }}
              >
                {staged.map((f) => (
                  <div
                    key={f.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={true}
                      onChange={() => unstageFile(f.path)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 'bold',
                        color: f.status === 'D' ? '#f14c4c' : f.status === 'A' ? '#4ec9b0' : '#e5c07b',
                        width: 14,
                        textAlign: 'center',
                      }}
                    >
                      {f.status}
                    </span>
                    <span
                      onClick={() => handleOpenFile(f.path)}
                      style={{
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                      }}
                      title={f.path}
                    >
                      {f.path}
                    </span>
                    <button
                      onClick={() => unstageFile(f.path)}
                      title="Unstage file"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        opacity: 0.6,
                        fontSize: 12,
                      }}
                    >
                      −
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unstaged & Untracked Files */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.8 }}>
                Working Tree Changes ({allUnstaged.length})
              </span>
              {allUnstaged.length > 0 && (
                <button
                  onClick={stageAll}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--vscode-textLink-foreground, #3794ff)',
                    cursor: 'pointer',
                    fontSize: 11,
                    padding: 0,
                  }}
                >
                  Stage All
                </button>
              )}
            </div>

            {allUnstaged.length === 0 ? (
              <div style={{ fontSize: 12, opacity: 0.5, fontStyle: 'italic', padding: '6px 0' }}>
                Working tree is clean!
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                  borderRadius: 6,
                  padding: 4,
                }}
              >
                {allUnstaged.map((f) => (
                  <div
                    key={f.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => stageFile(f.path)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 'bold',
                        color: f.status === 'D' ? '#f14c4c' : f.status === '?' ? '#4ec9b0' : '#e5c07b',
                        width: 14,
                        textAlign: 'center',
                      }}
                    >
                      {f.status}
                    </span>
                    <span
                      onClick={() => handleOpenFile(f.path)}
                      style={{
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                      }}
                      title={f.path}
                    >
                      {f.path}
                    </span>
                    <button
                      onClick={() => stageFile(f.path)}
                      title="Stage file"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#4ec9b0',
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                    >
                      ＋
                    </button>
                    <button
                      onClick={() => discardFile(f.path)}
                      title="Discard changes (Dangerous)"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#f14c4c',
                        cursor: 'pointer',
                        fontSize: 11,
                        opacity: 0.6,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Commit Message & Actions Composer */}
        <div
          style={{
            padding: '14px 18px',
            borderTop: '1px solid var(--vscode-editorWidget-border, #3c3c3c)',
            backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {/* Conventional Commit Type Chips */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {['feat: ', 'fix: ', 'refactor: ', 'docs: ', 'chore: ', 'test: '].map((prefix) => (
              <button
                key={prefix}
                onClick={() => handleConventionalPrefix(prefix)}
                style={{
                  padding: '2px 8px',
                  borderRadius: 10,
                  fontSize: 10,
                  border: '1px solid var(--vscode-editorWidget-border, #454545)',
                  backgroundColor: 'transparent',
                  color: 'inherit',
                  cursor: 'pointer',
                  opacity: 0.8,
                }}
              >
                {prefix.replace(':', '')}
              </button>
            ))}
          </div>

          {/* Commit Message Box */}
          <textarea
            value={commitMsg}
            onChange={(e) => setCommitMsg(e.target.value)}
            placeholder={isAmend ? 'Amend previous commit message...' : 'Commit message (Ctrl+Enter to commit)...'}
            rows={3}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleCommit(false);
              }
            }}
            style={{
              width: '100%',
              backgroundColor: 'var(--vscode-input-background, #3c3c3c)',
              color: 'var(--vscode-input-foreground, #cccccc)',
              border: '1px solid var(--vscode-input-border, #454545)',
              borderRadius: 4,
              padding: 8,
              fontSize: 12,
              fontFamily: 'inherit',
              resize: 'none',
              outline: 'none',
            }}
          />

          {/* Amend Option */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isAmend}
              onChange={(e) => setIsAmend(e.target.checked)}
            />
            <span>Amend previous commit</span>
          </label>

          {/* Commit Buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              onClick={() => handleCommit(false)}
              disabled={isSubmitting || (staged.length === 0 && !isAmend)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 4,
                border: 'none',
                backgroundColor: staged.length > 0 || isAmend ? '#107c41' : '#3a3d41',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 600,
                cursor: staged.length > 0 || isAmend ? 'pointer' : 'not-allowed',
                opacity: staged.length > 0 || isAmend ? 1 : 0.6,
              }}
            >
              {isAmend ? 'Amend Commit' : 'Commit'}
            </button>
            {!isAmend && (
              <button
                onClick={() => handleCommit(true)}
                disabled={isSubmitting || staged.length === 0}
                style={{
                  padding: '8px 14px',
                  borderRadius: 4,
                  border: '1px solid var(--vscode-button-border, #454545)',
                  backgroundColor: 'var(--vscode-button-secondaryBackground, #3a3d41)',
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: staged.length > 0 ? 'pointer' : 'not-allowed',
                  opacity: staged.length > 0 ? 1 : 0.6,
                }}
              >
                Commit & Push
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

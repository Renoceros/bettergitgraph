import React, { useEffect, useRef } from 'react';
import type { GitOperation } from '../../../extension/operation-executor';
import { IconDanger, IconInfo } from '../Icons/Icons';

export interface ConfirmDialogProps {
  operation: GitOperation;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  operation,
  onConfirm,
  onCancel,
}) => {
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    cancelBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const getDetails = (op: GitOperation) => {
    switch (op.op) {
      case 'RESET':
        return {
          title: `Confirm Reset (${op.mode.toUpperCase()})`,
          isDestructive: op.mode === 'hard',
          description:
            op.mode === 'hard'
              ? 'This will move your current branch pointer to this commit and PERMANENTLY DISCARD all uncommitted changes in your working directory and staging area.'
              : op.mode === 'soft'
              ? 'This will move your current branch pointer to this commit. All changes between here and your previous tip will remain safely in your staging area.'
              : 'This will move your branch pointer to this commit. All changes will remain in your working directory as unstaged files.',
          command: `git reset --${op.mode} ${op.hash.slice(0, 8)}`,
        };
      case 'REVERT':
        return {
          title: 'Confirm Revert',
          isDestructive: false,
          description: 'This will create a new commit that inverts the changes introduced by this commit.',
          command: `git revert ${op.hash.slice(0, 8)}`,
        };
      case 'CHERRY_PICK':
        return {
          title: 'Confirm Cherry-Pick',
          isDestructive: false,
          description: 'This will copy the changes from this commit and apply them directly on top of your current branch.',
          command: `git cherry-pick ${op.hash.slice(0, 8)}`,
        };
      case 'DELETE_BRANCH':
        return {
          title: `Confirm Delete Branch '${op.name}'`,
          isDestructive: Boolean(op.force),
          description: op.force
            ? `Force deleting branch '${op.name}'. Any unmerged commits exclusive to this branch may be lost.`
            : `Deleting branch '${op.name}'. Git will ensure its commits have already been merged.`,
          command: `git branch ${op.force ? '-D' : '-d'} ${op.name}`,
        };
      default:
        return {
          title: 'Confirm Operation',
          isDestructive: false,
          description: 'Are you sure you want to execute this git action?',
          command: JSON.stringify(op),
        };
    }
  };

  const details = getDetails(operation);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(2px)',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          width: 440,
          backgroundColor: 'var(--vscode-editorWidget-background, #252526)',
          border: `1px solid ${details.isDestructive ? '#f14c4c' : 'var(--vscode-editorWidget-border, #454545)'}`,
          borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          padding: 20,
          color: 'var(--vscode-foreground, #cccccc)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {details.isDestructive ? (
            <IconDanger size={20} color="#f14c4c" />
          ) : (
            <IconInfo size={20} color="#3794ff" />
          )}
          <h3
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 600,
              color: details.isDestructive ? '#f14c4c' : 'inherit',
            }}
          >
            {details.title}
          </h3>
        </div>

        {/* Description */}
        <div style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.9 }}>
          {details.description}
        </div>

        {/* Git Command Preview */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.6, marginBottom: 4 }}>
            Command to execute
          </div>
          <code
            style={{
              display: 'block',
              padding: '8px 12px',
              backgroundColor: 'var(--vscode-textCodeBlock-background, rgba(0,0,0,0.3))',
              border: '1px solid var(--vscode-editorWidget-border, #3c3c3c)',
              borderRadius: 4,
              fontFamily: 'monospace',
              fontSize: 12,
              color: '#4ec9b0',
            }}
          >
            {details.command}
          </code>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
          <button
            ref={cancelBtnRef}
            onClick={onCancel}
            style={{
              backgroundColor: 'var(--vscode-button-secondaryBackground, #3a3d41)',
              color: 'var(--vscode-button-secondaryForeground, #ffffff)',
              border: '1px solid var(--vscode-button-secondaryBorder, #454545)',
              borderRadius: 4,
              padding: '6px 14px',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              backgroundColor: details.isDestructive ? '#d93838' : 'var(--vscode-button-background, #0e639c)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 4,
              padding: '6px 16px',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {details.isDestructive ? 'Proceed (Destructive)' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

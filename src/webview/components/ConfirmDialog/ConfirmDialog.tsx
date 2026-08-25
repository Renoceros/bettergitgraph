import React, { useEffect, useRef, useState } from 'react';
import type { GitOperation } from '../../../extension/operation-executor';
import { IconDanger, IconInfo } from '../Icons/Icons';
import { useAppStore } from '../../store/store';

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
  const [step, setStep] = useState<1 | 2>(1);
  const { twoStageConfirmation } = useAppStore();

  useEffect(() => {
    cancelBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, step]);

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
      case 'PUSH':
        return {
          title: `Confirm Push${op.force ? ' (FORCE)' : ''}`,
          isDestructive: Boolean(op.force),
          description: op.force
            ? 'Force pushing will overwrite the remote branch history with your local commits. Anyone else working on this branch may encounter history divergence.'
            : 'Pushing local commits to remote origin.',
          command: `git push ${op.force ? '--force-with-lease ' : ''}${op.remote ?? 'origin'} ${op.branch ?? ''}`.trim(),
        };
      case 'DISCARD_FILE':
        return {
          title: `Confirm Discard Changes in ${op.file}`,
          isDestructive: true,
          description: `Are you sure you want to permanently discard all modifications in '${op.file}'? This cannot be undone.`,
          command: `git restore ${op.file}`,
        };
      case 'STASH_DROP':
        return {
          title: `Confirm Drop Stash stash@{${op.index}}`,
          isDestructive: true,
          description: `Are you sure you want to permanently remove stash@{${op.index}}? Stashed changes will be discarded.`,
          command: `git stash drop stash@{${op.index}}`,
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
  const requiresTwoStages = twoStageConfirmation && details.isDestructive;

  const handlePrimaryClick = () => {
    if (requiresTwoStages && step === 1) {
      setStep(2);
    } else {
      onConfirm();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(3px)',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          width: 460,
          backgroundColor: 'var(--vscode-editorWidget-background, #252526)',
          border: `1px solid ${details.isDestructive ? (step === 2 ? '#ff0033' : '#f14c4c') : 'var(--vscode-editorWidget-border, #454545)'}`,
          borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
          padding: 22,
          color: 'var(--vscode-foreground, #cccccc)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {details.isDestructive ? (
              <IconDanger size={22} color={step === 2 ? '#ff0033' : '#f14c4c'} />
            ) : (
              <IconInfo size={20} color="#3794ff" />
            )}
            <h3
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 600,
                color: details.isDestructive ? (step === 2 ? '#ff0033' : '#f14c4c') : 'inherit',
              }}
            >
              {details.title}
            </h3>
          </div>
          {requiresTwoStages && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 'bold',
                padding: '2px 8px',
                borderRadius: 10,
                backgroundColor: step === 2 ? '#7a1010' : '#422020',
                color: '#ff8888',
              }}
            >
              Step {step} of 2
            </span>
          )}
        </div>

        {/* Step 2 Critical Warning Banner */}
        {step === 2 ? (
          <div
            style={{
              backgroundColor: 'rgba(255, 0, 51, 0.12)',
              border: '1px solid rgba(255, 0, 51, 0.4)',
              borderRadius: 6,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#ff4444' }}>
              Final Guardrail Warning
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.4, color: '#dddddd' }}>
              This operation is <strong>IRREVERSIBLE</strong> and cannot be undone. Any discarded working modifications or overwritten history cannot be recovered.
            </div>
          </div>
        ) : (
          /* Description */
          <div style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.9 }}>
            {details.description}
          </div>
        )}

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
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
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
            onClick={handlePrimaryClick}
            style={{
              backgroundColor: details.isDestructive
                ? step === 2
                  ? '#cc0029'
                  : '#d93838'
                : 'var(--vscode-button-background, #0e639c)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 4,
              padding: '6px 16px',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {requiresTwoStages && step === 1
              ? 'Continue to Final Confirmation →'
              : details.isDestructive
              ? 'Confirm Irreversible Action'
              : 'Confirm'}
          </button>
        </div>

        {requiresTwoStages && step === 1 && (
          <div style={{ fontSize: 11, opacity: 0.5, textAlign: 'center', marginTop: -6 }}>
            (2-stage confirmation enabled in settings: bettergitgraph.twoStageConfirmation)
          </div>
        )}
      </div>
    </div>
  );
};

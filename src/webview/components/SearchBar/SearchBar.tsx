import React from 'react';
import { useAppStore } from '../../store/store';
import { messageBus } from '../../store/message-bus';

export const SearchBar: React.FC = () => {
  const {
    commits,
    branches,
    searchQuery,
    filteredHashes,
    layoutDirection,
    beginnerMode,
    isFetching,
    setSearchQuery,
    setLayoutDirection,
    setBeginnerMode,
    setIsFetching,
  } = useAppStore();

  const handleFetchAll = () => {
    setIsFetching(true);
    messageBus.send({ type: 'FETCH_ALL' });
  };

  return (
    <header
      style={{
        height: 48,
        backgroundColor: 'var(--vscode-titleBar-activeBackground, #1e1e1e)',
        borderBottom: '1px solid var(--vscode-titleBar-border, #333333)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        gap: 16,
        color: 'var(--vscode-foreground, #cccccc)',
        fontSize: 12,
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {/* Brand & Stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'bold', fontSize: 13 }}>
          <span style={{ color: '#4ec9b0' }}>●</span>
          <span>BetterGitGraph</span>
        </div>
        <div style={{ display: 'flex', gap: 8, opacity: 0.7, fontSize: 11 }}>
          <span>{commits.length} commits</span>
          <span>•</span>
          <span>{branches.length} branches</span>
        </div>
      </div>

      {/* Search Input */}
      <div style={{ flex: 1, maxWidth: 400, position: 'relative' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search commits by message, author, SHA, ref…"
          style={{
            width: '100%',
            backgroundColor: 'var(--vscode-input-background, #3c3c3c)',
            color: 'var(--vscode-input-foreground, #cccccc)',
            border: '1px solid var(--vscode-input-border, #3c3c3c)',
            borderRadius: 4,
            padding: '6px 12px',
            fontSize: 12,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {filteredHashes && (
          <span
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 11,
              opacity: 0.7,
              backgroundColor: 'var(--vscode-badge-background, #4d4d4d)',
              color: 'var(--vscode-badge-foreground, #fff)',
              padding: '1px 6px',
              borderRadius: 10,
            }}
          >
            {filteredHashes.size} matches
          </span>
        )}
      </div>

      {/* Action Buttons & Toggles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={handleFetchAll}
          disabled={isFetching}
          style={{
            backgroundColor: 'var(--vscode-button-background, #0e639c)',
            color: 'var(--vscode-button-foreground, #ffffff)',
            border: 'none',
            borderRadius: 4,
            padding: '6px 12px',
            cursor: isFetching ? 'not-allowed' : 'pointer',
            fontSize: 12,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            opacity: isFetching ? 0.6 : 1,
          }}
        >
          {isFetching ? 'Fetching…' : '↓ Fetch All'}
        </button>

        {/* Direction Toggle */}
        <button
          onClick={() => setLayoutDirection(layoutDirection === 'TB' ? 'LR' : 'TB')}
          title="Toggle Layout Orientation"
          style={secondaryBtnStyle}
        >
          {layoutDirection === 'TB' ? '↓ Top-Bottom' : '→ Left-Right'}
        </button>

        {/* Beginner Mode Toggle */}
        <button
          onClick={() => setBeginnerMode(!beginnerMode)}
          title="Toggle Beginner Mode Explanations"
          style={{
            ...secondaryBtnStyle,
            backgroundColor: beginnerMode
              ? 'rgba(78, 201, 176, 0.2)'
              : 'transparent',
            borderColor: beginnerMode
              ? '#4ec9b0'
              : 'var(--vscode-button-secondaryBorder, #454545)',
          }}
        >
          🎓 Beginner Mode: {beginnerMode ? 'ON' : 'OFF'}
        </button>
      </div>
    </header>
  );
};

const secondaryBtnStyle: React.CSSProperties = {
  backgroundColor: 'var(--vscode-button-secondaryBackground, #3a3d41)',
  color: 'var(--vscode-button-secondaryForeground, #ffffff)',
  border: '1px solid var(--vscode-button-secondaryBorder, #454545)',
  borderRadius: 4,
  padding: '6px 10px',
  cursor: 'pointer',
  fontSize: 11,
};

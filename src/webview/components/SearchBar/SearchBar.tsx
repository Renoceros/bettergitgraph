import React from 'react';
import { useAppStore } from '../../store/store';
import { messageBus } from '../../store/message-bus';

export const SearchBar: React.FC = () => {
  const {
    commits,
    branches,
    searchQuery,
    filteredHashes,
    viewMode,
    layoutDirection,
    beginnerMode,
    isFetching,
    setSearchQuery,
    setViewMode,
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
        gap: 12,
        color: 'var(--vscode-foreground, #cccccc)',
        fontSize: 12,
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {/* Brand & Stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'bold', fontSize: 13 }}>
          <span style={{ color: '#4ec9b0', fontSize: 16 }}>🌳</span>
          <span>BetterGitGraph</span>
        </div>
        <div style={{ display: 'flex', gap: 6, opacity: 0.7, fontSize: 11 }}>
          <span>{commits.length} commits</span>
          <span>•</span>
          <span>{branches.length} branches</span>
        </div>
      </div>

      {/* View Mode Switcher (Tree Structure vs Timeline) */}
      <div
        style={{
          display: 'flex',
          backgroundColor: 'var(--vscode-editorWidget-background, #252526)',
          border: '1px solid var(--vscode-editorWidget-border, #3c3c3c)',
          borderRadius: 6,
          padding: 2,
        }}
      >
        <button
          onClick={() => setViewMode('topo')}
          title="Tree Structure View: Commits structured by parent-child branches & merges"
          style={{
            ...pillStyle,
            backgroundColor: viewMode === 'topo' ? 'var(--vscode-button-background, #0e639c)' : 'transparent',
            color: viewMode === 'topo' ? '#ffffff' : 'var(--vscode-foreground)',
            fontWeight: viewMode === 'topo' ? 600 : 400,
          }}
        >
          🌳 Tree View
        </button>
        <button
          onClick={() => setViewMode('temporal')}
          title="Timeline View: Commits ordered strictly chronologically by time with main as central trunk"
          style={{
            ...pillStyle,
            backgroundColor: viewMode === 'temporal' ? 'var(--vscode-button-background, #0e639c)' : 'transparent',
            color: viewMode === 'temporal' ? '#ffffff' : 'var(--vscode-foreground)',
            fontWeight: viewMode === 'temporal' ? 600 : 400,
          }}
        >
          ⏱️ Timeline View
        </button>
      </div>

      {/* Search Input */}
      <div style={{ flex: 1, maxWidth: 360, position: 'relative' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by title, author, branch, SHA…"
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

        {/* Orientation Toggle */}
        <button
          onClick={() => setLayoutDirection(layoutDirection === 'TB' ? 'LR' : 'TB')}
          title="Toggle Layout Direction"
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
            backgroundColor: beginnerMode ? 'rgba(78, 201, 176, 0.2)' : 'transparent',
            borderColor: beginnerMode ? '#4ec9b0' : 'var(--vscode-button-secondaryBorder, #454545)',
          }}
        >
          🎓 Beginner Mode: {beginnerMode ? 'ON' : 'OFF'}
        </button>
      </div>
    </header>
  );
};

const pillStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: 4,
  padding: '4px 10px',
  cursor: 'pointer',
  fontSize: 11,
  transition: 'all 0.15s',
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

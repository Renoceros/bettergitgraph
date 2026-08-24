import React from 'react';
import { useAppStore } from '../../store/store';
import { messageBus } from '../../store/message-bus';
import { IconTree, IconTimeline, IconBook, IconFetch, IconExternalLink } from '../Icons/Icons';
import type { LayoutDirection, DateFormat } from '../GraphCanvas/dag-layout';

export const SearchBar: React.FC = () => {
  const {
    commits,
    branches,
    remoteInfo,
    searchQuery,
    filteredHashes,
    viewMode,
    layoutDirection,
    dateFormat,
    beginnerMode,
    isFetching,
    setSearchQuery,
    setViewMode,
    setLayoutDirection,
    setDateFormat,
    setBeginnerMode,
    setIsFetching,
    openRepoOnWeb,
  } = useAppStore();

  const handleFetchAll = () => {
    setIsFetching(true);
    messageBus.send({ type: 'FETCH_ALL' });
  };

  const getProviderName = () => {
    if (!remoteInfo) return 'Remote';
    switch (remoteInfo.provider) {
      case 'github':
        return 'GitHub';
      case 'gitlab':
        return 'GitLab';
      case 'bitbucket':
        return 'Bitbucket';
      case 'azure':
        return 'Azure DevOps';
      default:
        return 'Remote';
    }
  };

  const handleCycleDirection = () => {
    const directions: LayoutDirection[] = ['TB', 'BT', 'LR', 'RL'];
    const currentIndex = directions.indexOf(layoutDirection);
    const nextDirection = directions[(currentIndex + 1) % directions.length]!;
    setLayoutDirection(nextDirection);
  };

  const handleCycleDateFormat = () => {
    const formats: DateFormat[] = ['local', 'relative', 'iso'];
    const currentIndex = formats.indexOf(dateFormat);
    const nextFormat = formats[(currentIndex + 1) % formats.length]!;
    setDateFormat(nextFormat);
  };

  const getDirectionLabel = (dir: LayoutDirection): string => {
    switch (dir) {
      case 'TB':
        return 'Top-to-Bottom';
      case 'BT':
        return 'Bottom-to-Top';
      case 'LR':
        return 'Left-to-Right';
      case 'RL':
        return 'Right-to-Left';
    }
  };

  const getDateFormatLabel = (df: DateFormat): string => {
    switch (df) {
      case 'local':
        return 'Local Time';
      case 'relative':
        return 'Relative Time';
      case 'iso':
        return 'ISO Date';
    }
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'bold', fontSize: 13 }}>
          <IconTree size={16} color="#4ec9b0" />
          <span>BetterGitGraph</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: 0.8, fontSize: 11 }}>
          <span>{commits.length} commits</span>
          <span>•</span>
          <span>{branches.length} branches</span>
          {remoteInfo && (
            <>
              <span>•</span>
              <button
                onClick={openRepoOnWeb}
                title={`Open repository on ${getProviderName()}: ${remoteInfo.webUrl}`}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--vscode-button-secondaryBorder, #454545)',
                  borderRadius: 4,
                  padding: '2px 8px',
                  color: 'var(--vscode-textLink-foreground, #4ec9b0)',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <IconExternalLink size={12} color="#4ec9b0" />
                <span>{getProviderName()}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* View Mode Switcher */}
      <div
        style={{
          display: 'flex',
          backgroundColor: 'var(--vscode-editorWidget-background, #252526)',
          border: '1px solid var(--vscode-editorWidget-border, #3c3c3c)',
          borderRadius: 6,
          padding: 2,
          gap: 2,
        }}
      >
        <button
          onClick={() => setViewMode('temporal')}
          title="Timeline View: Commits ordered strictly chronologically with main as central trunk"
          style={{
            ...pillStyle,
            backgroundColor: viewMode === 'temporal' ? 'var(--vscode-button-background, #0e639c)' : 'transparent',
            color: viewMode === 'temporal' ? '#ffffff' : 'var(--vscode-foreground)',
            fontWeight: viewMode === 'temporal' ? 600 : 400,
          }}
        >
          <IconTimeline size={13} style={{ marginRight: 6 }} />
          Timeline View
        </button>
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
          <IconTree size={13} style={{ marginRight: 6 }} />
          Tree View
        </button>
      </div>

      {/* Search Input */}
      <div style={{ flex: 1, maxWidth: 320, position: 'relative' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by title, author, branch, file, SHA…"
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
          <IconFetch size={13} />
          {isFetching ? 'Fetching…' : 'Fetch All'}
        </button>

        {/* Direction Cycle Toggle */}
        <button
          onClick={handleCycleDirection}
          title="Click to cycle direction: Top-Bottom -> Bottom-Top -> Left-Right -> Right-Left"
          style={secondaryBtnStyle}
        >
          {getDirectionLabel(layoutDirection)}
        </button>

        {/* Date Format Cycle Toggle */}
        <button
          onClick={handleCycleDateFormat}
          title="Click to cycle timestamp format: Local Time -> Relative -> ISO Date"
          style={secondaryBtnStyle}
        >
          {getDateFormatLabel(dateFormat)}
        </button>

        {/* Beginner Mode Toggle */}
        <button
          onClick={() => setBeginnerMode(!beginnerMode)}
          title="Toggle Beginner Mode Explanations"
          style={{
            ...secondaryBtnStyle,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: beginnerMode ? 'rgba(78, 201, 176, 0.2)' : 'transparent',
            borderColor: beginnerMode ? '#4ec9b0' : 'var(--vscode-button-secondaryBorder, #454545)',
          }}
        >
          <IconBook size={13} color={beginnerMode ? '#4ec9b0' : 'currentColor'} />
          Beginner: {beginnerMode ? 'ON' : 'OFF'}
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
  display: 'inline-flex',
  alignItems: 'center',
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

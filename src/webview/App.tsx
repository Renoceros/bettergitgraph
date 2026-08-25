import React, { useEffect } from 'react';
import { SearchBar } from './components/SearchBar/SearchBar';
import { GraphCanvas } from './components/GraphCanvas/GraphCanvas';
import { CommitDetail } from './components/CommitDetail/CommitDetail';
import { CommitDrawer } from './components/CommitDrawer/CommitDrawer';
import { messageBus } from './store/message-bus';

export const App: React.FC = () => {
  useEffect(() => {
    // Notify VS Code host that webview is mounted and ready to receive graph data
    messageBus.send({ type: 'READY' });
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: 'var(--vscode-editor-background, #1e1e1e)',
        fontFamily: 'var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif)',
      }}
    >
      <SearchBar />
      <div
        style={{
          display: 'flex',
          flex: 1,
          width: '100%',
          height: 'calc(100vh - 48px)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ flex: 1, height: '100%', position: 'relative' }}>
          <GraphCanvas />
        </div>
        <CommitDetail />
      </div>
      <CommitDrawer />
    </div>
  );
};

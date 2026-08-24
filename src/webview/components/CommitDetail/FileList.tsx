import React from 'react';
import type { ChangedFile } from '../../../extension/git-data';
import { messageBus } from '../../store/message-bus';

interface FileListProps {
  hash: string;
  files: ChangedFile[];
  loading: boolean;
}

export const FileList: React.FC<FileListProps> = ({ hash, files, loading }) => {
  const [filterQuery, setFilterQuery] = React.useState('');

  if (loading) {
    return (
      <div style={{ padding: '16px 0', opacity: 0.7, fontSize: 12 }}>
        Loading changed files…
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <div style={{ padding: '16px 0', opacity: 0.6, fontSize: 12 }}>
        No changed files in this commit.
      </div>
    );
  }

  const filtered = filterQuery.trim()
    ? files.filter((f) => f.path.toLowerCase().includes(filterQuery.trim().toLowerCase()))
    : files;

  const handleFileClick = (filePath: string) => {
    messageBus.send({
      type: 'OPEN_DIFF',
      payload: { hash, filePath },
    });
  };

  const getStatusBadge = (status: ChangedFile['status']) => {
    switch (status) {
      case 'A':
        return <span style={{ color: '#4ec9b0', fontWeight: 'bold', marginRight: 8 }}>A</span>;
      case 'D':
        return <span style={{ color: '#f14c4c', fontWeight: 'bold', marginRight: 8 }}>D</span>;
      case 'M':
        return <span style={{ color: '#e5a50a', fontWeight: 'bold', marginRight: 8 }}>M</span>;
      case 'R':
        return <span style={{ color: '#3794ff', fontWeight: 'bold', marginRight: 8 }}>R</span>;
      default:
        return <span style={{ color: '#888', marginRight: 8 }}>?</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
      {files.length >= 3 && (
        <input
          type="text"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder={`Filter ${files.length} changed files…`}
          style={{
            width: '100%',
            backgroundColor: 'var(--vscode-input-background, #3c3c3c)',
            color: 'var(--vscode-input-foreground, #cccccc)',
            border: '1px solid var(--vscode-input-border, #454545)',
            borderRadius: 4,
            padding: '4px 8px',
            fontSize: 11,
            outline: 'none',
            boxSizing: 'border-box',
            marginBottom: 4,
          }}
        />
      )}
      {filtered.length === 0 && (
        <div style={{ padding: '8px 4px', fontSize: 11, opacity: 0.6 }}>
          No files matching "{filterQuery}"
        </div>
      )}
      {filtered.map((file, idx) => (
        <div
          key={`${file.path}-${idx}`}
          onClick={() => handleFileClick(file.path)}
          title={`Click to view diff: ${file.path}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '6px 8px',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 12,
            backgroundColor: 'var(--vscode-list-hoverBackground, rgba(255,255,255,0.05))',
            transition: 'background 0.15s',
          }}
        >
          {getStatusBadge(file.status)}
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: 'var(--vscode-foreground)',
            }}
          >
            {file.path}
          </span>
        </div>
      ))}
    </div>
  );
};

import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../../store/store';
import {
  IconTree,
  IconTimeline,
  IconCheck,
  IconReset,
  IconExternalLink,
} from '../Icons/Icons';

export interface BackgroundContextMenuProps {
  x: number;
  y: number;
  onExportSvg: () => void;
  onExportPng: () => void;
  onFitToScreen: () => void;
  onCenterHead: () => void;
  onClose: () => void;
}

export const BackgroundContextMenu: React.FC<BackgroundContextMenuProps> = ({
  x,
  y,
  onExportSvg,
  onExportPng,
  onFitToScreen,
  onCenterHead,
  onClose,
}) => {
  const { remoteInfo, openRepoOnWeb } = useAppStore();
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const menuWidth = 240;
  const estimatedHeight = 220;
  const adjustedX = Math.max(10, Math.min(x, window.innerWidth - menuWidth - 10));
  const adjustedY = Math.max(10, Math.min(y, window.innerHeight - estimatedHeight - 10));

  return (
    <div
      ref={menuRef}
      role="menu"
      style={{
        position: 'fixed',
        left: adjustedX,
        top: adjustedY,
        width: menuWidth,
        maxHeight: 'calc(100vh - 24px)',
        overflowY: 'auto',
        overflowX: 'hidden',
        boxSizing: 'border-box',
        backgroundColor: 'var(--vscode-menu-background, #252526)',
        color: 'var(--vscode-menu-foreground, #cccccc)',
        border: '1px solid var(--vscode-menu-border, #454545)',
        borderRadius: 6,
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        padding: '6px 0',
        zIndex: 2000,
        fontSize: 12,
        userSelect: 'none',
      }}
    >
      <div
        style={{
          padding: '6px 12px',
          fontSize: 11,
          fontWeight: 'bold',
          opacity: 0.6,
          borderBottom: '1px solid var(--vscode-menu-separatorBackground, #3c3c3c)',
          marginBottom: 4,
        }}
      >
        Repository Graph Actions
      </div>

      <div
        role="menuitem"
        onClick={() => {
          onExportSvg();
          onClose();
        }}
        style={menuItemStyle}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--vscode-menu-selectionBackground, #04395e)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <span style={{ color: '#4ec9b0', display: 'flex', alignItems: 'center' }}>
          <IconTree size={14} color="#4ec9b0" />
        </span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600 }}>Export Repo Map as SVG</span>
          <span style={{ fontSize: 10, opacity: 0.6 }}>Vector graphic (.svg)</span>
        </div>
      </div>

      <div
        role="menuitem"
        onClick={() => {
          onExportPng();
          onClose();
        }}
        style={menuItemStyle}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--vscode-menu-selectionBackground, #04395e)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <span style={{ color: '#569cd6', display: 'flex', alignItems: 'center' }}>
          <IconTimeline size={14} color="#569cd6" />
        </span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600 }}>Export Repo Map as PNG</span>
          <span style={{ fontSize: 10, opacity: 0.6 }}>High-res raster snapshot (.png)</span>
        </div>
      </div>

      <div style={{ height: 1, backgroundColor: 'var(--vscode-menu-separatorBackground, #3c3c3c)', margin: '4px 0' }} />

      <div
        role="menuitem"
        onClick={() => {
          onFitToScreen();
          onClose();
        }}
        style={menuItemStyle}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--vscode-menu-selectionBackground, #04395e)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <IconCheck size={14} />
        </span>
        <span>Fit Graph to Screen</span>
      </div>

      <div
        role="menuitem"
        onClick={() => {
          onCenterHead();
          onClose();
        }}
        style={menuItemStyle}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--vscode-menu-selectionBackground, #04395e)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <IconReset size={14} />
        </span>
        <span>Center HEAD Commit</span>
      </div>

      {remoteInfo && (
        <>
          <div style={{ height: 1, backgroundColor: 'var(--vscode-menu-separatorBackground, #3c3c3c)', margin: '4px 0' }} />
          <div
            role="menuitem"
            onClick={() => {
              openRepoOnWeb();
              onClose();
            }}
            style={menuItemStyle}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--vscode-menu-selectionBackground, #04395e)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <span style={{ display: 'flex', alignItems: 'center' }}>
              <IconExternalLink size={14} color="#4ec9b0" />
            </span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 600 }}>Open Repository on Web</span>
              <span style={{ fontSize: 10, opacity: 0.6 }}>{remoteInfo.webUrl}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const menuItemStyle: React.CSSProperties = {
  padding: '6px 12px',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  cursor: 'pointer',
};

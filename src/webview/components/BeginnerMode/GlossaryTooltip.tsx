import React, { useState } from 'react';
import { GIT_GLOSSARY } from '../../data/glossary';
import { IconInfo } from '../Icons/Icons';

interface GlossaryTooltipProps {
  termKey: keyof typeof GIT_GLOSSARY;
  children: React.ReactNode;
}

export const GlossaryTooltip: React.FC<GlossaryTooltipProps> = ({ termKey, children }) => {
  const [show, setShow] = useState(false);
  const info = GIT_GLOSSARY[termKey];

  if (!info) return <>{children}</>;

  return (
    <span
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span
        style={{
          borderBottom: '1px dotted var(--vscode-editorInfo-foreground, #3794ff)',
          cursor: 'help',
        }}
      >
        {children}
      </span>

      {show && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%) translateY(-6px)',
            width: 240,
            backgroundColor: 'var(--vscode-editorHoverWidget-background, #252526)',
            color: 'var(--vscode-editorHoverWidget-foreground, #cccccc)',
            border: '1px solid var(--vscode-editorHoverWidget-border, #454545)',
            borderRadius: 6,
            padding: 10,
            fontSize: 11,
            boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
            zIndex: 3000,
            pointerEvents: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'bold', color: '#4ec9b0', marginBottom: 4 }}>
            <IconInfo size={13} color="#4ec9b0" />
            <span>{info.title}</span>
          </div>
          <div style={{ marginBottom: 6, lineHeight: 1.4 }}>{info.definition}</div>
          <div style={{ opacity: 0.8, fontStyle: 'italic', color: '#ffd43b' }}>
            &ldquo;{info.analogy}&rdquo;
          </div>
        </div>
      )}
    </span>
  );
};

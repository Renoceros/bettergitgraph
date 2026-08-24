// Placeholder — webview React app entry point
// Full implementation coming in M3 (Webview Shell milestone)
// See TECH_DOCS.md §5.4 for the architecture

const vscode = (window as unknown as { acquireVsCodeApi: () => unknown }).acquireVsCodeApi?.();

const root = document.getElementById('root');
if (root) {
  root.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: var(--vscode-font-family, sans-serif);
      color: var(--vscode-foreground);
      flex-direction: column;
      gap: 12px;
    ">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="8" r="6" fill="#4ec9b0"/>
        <circle cx="8" cy="32" r="6" fill="#569cd6"/>
        <circle cx="40" cy="32" r="6" fill="#ce9178"/>
        <line x1="24" y1="14" x2="8" y2="26" stroke="#4ec9b0" stroke-width="2"/>
        <line x1="24" y1="14" x2="40" y2="26" stroke="#4ec9b0" stroke-width="2"/>
      </svg>
      <h2 style="margin:0">BetterGitGraph</h2>
      <p style="margin:0;opacity:0.6">Webview loading… (scaffold placeholder)</p>
    </div>
  `;
}

// Signal to extension host that we're ready
if (vscode) {
  (vscode as { postMessage: (msg: unknown) => void }).postMessage({ type: 'READY' });
}

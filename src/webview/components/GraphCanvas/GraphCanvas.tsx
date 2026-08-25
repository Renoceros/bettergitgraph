import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../../store/store';
import { CanvasRenderer } from './renderer';
import { messageBus } from '../../store/message-bus';
import { ContextMenu } from '../ContextMenu/ContextMenu';
import { BackgroundContextMenu } from '../ContextMenu/BackgroundContextMenu';
import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog';
import { NodePopup } from '../NodePopup/NodePopup';
import { IconTree } from '../Icons/Icons';
import { exportGraphToSvg, downloadSvg, downloadCanvasPng } from '../../utils/svg-exporter';
import type { LayoutNode } from './dag-layout';
import type { GitOperation } from '../../../extension/operation-executor';

export const GraphCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [nodeContextMenu, setNodeContextMenu] = useState<{
    x: number;
    y: number;
    node: LayoutNode;
  } | null>(null);

  const [bgContextMenu, setBgContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [popupNodeState, setPopupNodeState] = useState<{
    node: LayoutNode;
    screenX: number;
    screenY: number;
  } | null>(null);

  const [pendingConfirmOp, setPendingConfirmOp] = useState<GitOperation | null>(null);

  const {
    commits,
    branches,
    layout,
    viewport,
    selectedHash,
    hoveredHash,
    highlightedBranch,
    filteredHashes,
    beginnerMode,
    commitDetail,
    theme,
    mainTrunkStrokeWidth,
    branchStrokeWidth,
    setCommitDrawerOpen,
    setViewport,
    selectCommit,
    setHoveredCommit,
    resetViewport,
    fitToScreen,
  } = useAppStore();

  // Initialize Canvas Renderer
  useEffect(() => {
    if (!canvasRef.current) return;
    rendererRef.current = new CanvasRenderer(canvasRef.current);
  }, []);

  // Resize canvas
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.parentElement) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    const width = Math.floor(rect.width);
    const height = Math.floor(rect.height);

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    setViewport((prev) => ({ ...prev, width, height }));
  }, [setViewport]);

  useEffect(() => {
    handleResize();
    const canvas = canvasRef.current;
    if (!canvas?.parentElement) return;

    const observer = new ResizeObserver(handleResize);
    observer.observe(canvas.parentElement);
    return () => observer.disconnect();
  }, [handleResize]);

  // Main render pass
  useEffect(() => {
    if (!rendererRef.current || !layout) return;
    rendererRef.current.render(layout, viewport, {
      selectedHash,
      hoveredHash,
      highlightedBranch,
      filteredHashes,
      theme,
      mainTrunkStrokeWidth,
      branchStrokeWidth,
    });
  }, [layout, viewport, selectedHash, hoveredHash, highlightedBranch, filteredHashes, theme, mainTrunkStrokeWidth, branchStrokeWidth]);

  // ── Mouse Pan ───────────────────────────────────────────────────────────────

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.button !== 1) return;
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDraggingRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      setViewport((prev) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));
    } else if (rendererRef.current && layout) {
      const hitNode = rendererRef.current.hitTest(mouseX, mouseY, layout, viewport);
      if (hitNode) {
        canvas.style.cursor = 'pointer';
        setHoveredCommit(hitNode.hash);
      } else {
        canvas.style.cursor = 'default';
        if (hoveredHash) setHoveredCommit(null);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;

    const dx = Math.abs(e.clientX - lastMousePosRef.current.x);
    const dy = Math.abs(e.clientY - lastMousePosRef.current.y);

    // Click on node opens popup details card or Commit Drawer for WIP
    if (dx < 5 && dy < 5 && rendererRef.current && layout) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const clickedNode = rendererRef.current.hitTest(clickX, clickY, layout, viewport);
      if (clickedNode) {
        if (clickedNode.isWip || clickedNode.hash === '__WIP__') {
          setCommitDrawerOpen(true);
          selectCommit(null);
          setPopupNodeState(null);
          return;
        }

        selectCommit(clickedNode.hash);
        setPopupNodeState({
          node: clickedNode,
          screenX: e.clientX,
          screenY: e.clientY,
        });
        messageBus.send({
          type: 'REQUEST_COMMIT_FILES',
          payload: { hash: clickedNode.hash },
        });
      } else {
        selectCommit(null);
        setPopupNodeState(null);
      }
    }
  };

  // ── Context Menu (Right Click on Node or Background) ─────────────────────────

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas || !rendererRef.current || !layout) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const hitNode = rendererRef.current.hitTest(clickX, clickY, layout, viewport);
    if (hitNode) {
      selectCommit(hitNode.hash);
      setBgContextMenu(null);
      setNodeContextMenu({
        x: e.clientX,
        y: e.clientY,
        node: hitNode,
      });
    } else {
      setNodeContextMenu(null);
      setBgContextMenu({
        x: e.clientX,
        y: e.clientY,
      });
    }
  };

  // ── SVG & PNG Export ────────────────────────────────────────────────────────

  const handleExportSvg = () => {
    if (!layout) return;
    const svgStr = exportGraphToSvg(layout, {
      theme: theme === 'light' ? 'light' : 'dark',
      mainTrunkStrokeWidth,
      branchStrokeWidth,
    });
    downloadSvg(svgStr, 'bettergitgraph-repo-map.svg');
  };

  const handleExportPng = () => {
    if (!canvasRef.current) return;
    downloadCanvasPng(canvasRef.current, 'bettergitgraph-repo-map.png');
  };

  // ── Operation Dispatch & Confirmation ───────────────────────────────────────

  const handleSelectOperation = (op: GitOperation, requiresConfirm = false) => {
    if (requiresConfirm || (op.op === 'RESET' && op.mode === 'hard')) {
      setPendingConfirmOp(op);
    } else {
      messageBus.send({ type: 'EXECUTE_OPERATION', payload: op });
    }
  };

  const handleConfirmOperation = () => {
    if (!pendingConfirmOp) return;
    const finalOp = { ...pendingConfirmOp, confirmed: true };
    messageBus.send({ type: 'EXECUTE_OPERATION', payload: finalOp });
    setPendingConfirmOp(null);
  };

  const handleSelectParent = (parentHash: string) => {
    if (!layout) return;
    const parentNode = layout.nodeMap.get(parentHash);
    if (parentNode) {
      selectCommit(parentNode.hash);
      setPopupNodeState((prev) =>
        prev ? { ...prev, node: parentNode } : null
      );
      setViewport((prev) => ({
        ...prev,
        x: prev.width / 2 - parentNode.x,
        y: prev.height / 3 - parentNode.y,
      }));
      messageBus.send({
        type: 'REQUEST_COMMIT_FILES',
        payload: { hash: parentNode.hash },
      });
    }
  };

  // ── Cursor-Centered Zoom ────────────────────────────────────────────────────

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;

    setViewport((prev) => {
      const newZoom = Math.min(3.0, Math.max(0.2, prev.zoom * zoomFactor));
      const graphX = (mouseX - prev.x) / prev.zoom;
      const graphY = (mouseY - prev.y) / prev.zoom;

      const newX = mouseX - graphX * newZoom;
      const newY = mouseY - graphY * newZoom;

      return {
        ...prev,
        zoom: newZoom,
        x: newX,
        y: newY,
      };
    });
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        userSelect: 'none',
        backgroundColor: theme === 'light' ? '#ffffff' : '#1e1e1e',
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        onWheel={handleWheel}
        onDoubleClick={resetViewport}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />

      {/* Floating Canvas Controls Toolbar */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          display: 'flex',
          gap: 6,
          backgroundColor: 'var(--vscode-editorWidget-background, #252526)',
          border: '1px solid var(--vscode-editorWidget-border, #454545)',
          borderRadius: 6,
          padding: '4px 8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          alignItems: 'center',
          fontSize: 12,
        }}
      >
        <button
          onClick={() =>
            setViewport((v) => ({ ...v, zoom: Math.min(3.0, v.zoom * 1.2) }))
          }
          title="Zoom In"
          style={buttonStyle}
        >
          ＋
        </button>
        <span style={{ color: 'var(--vscode-foreground)', minWidth: 40, textAlign: 'center' }}>
          {Math.round(viewport.zoom * 100)}%
        </span>
        <button
          onClick={() =>
            setViewport((v) => ({ ...v, zoom: Math.max(0.2, v.zoom / 1.2) }))
          }
          title="Zoom Out"
          style={buttonStyle}
        >
          －
        </button>
        <div style={{ width: 1, height: 16, backgroundColor: '#555', margin: '0 4px' }} />
        <button onClick={fitToScreen} title="Fit Entire Graph to Screen (⛶)" style={buttonStyle}>
          ⛶ Fit
        </button>
        <button onClick={resetViewport} title="Center HEAD (Double click canvas)" style={buttonStyle}>
          Center HEAD
        </button>
        <div style={{ width: 1, height: 16, backgroundColor: '#555', margin: '0 4px' }} />
        <button onClick={handleExportSvg} title="Export Repo Map as SVG" style={buttonStyle}>
          SVG
        </button>
      </div>

      {/* Floating Node Details Popup */}
      {popupNodeState && (
        <NodePopup
          node={popupNodeState.node}
          files={commitDetail?.files ?? []}
          loadingFiles={commitDetail?.loading ?? false}
          screenX={popupNodeState.screenX}
          screenY={popupNodeState.screenY}
          onSelectParent={handleSelectParent}
          onExecuteOperation={handleSelectOperation}
          onClose={() => setPopupNodeState(null)}
        />
      )}

      {/* Right-Click Commit Node Menu */}
      {nodeContextMenu && (
        <ContextMenu
          x={nodeContextMenu.x}
          y={nodeContextMenu.y}
          node={nodeContextMenu.node}
          beginnerMode={beginnerMode}
          onSelectOperation={handleSelectOperation}
          onClose={() => setNodeContextMenu(null)}
        />
      )}

      {/* Right-Click Background Menu */}
      {bgContextMenu && (
        <BackgroundContextMenu
          x={bgContextMenu.x}
          y={bgContextMenu.y}
          onExportSvg={handleExportSvg}
          onExportPng={handleExportPng}
          onFitToScreen={fitToScreen}
          onCenterHead={resetViewport}
          onClose={() => setBgContextMenu(null)}
        />
      )}

      {/* Floating Top-Left Stats HUD */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 14,
          zIndex: 5,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '3px 10px',
          borderRadius: 12,
          backgroundColor: 'rgba(25, 25, 26, 0.72)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          fontSize: 11,
          color: 'var(--vscode-foreground, #cccccc)',
          userSelect: 'none',
        }}
      >
        <span style={{ fontWeight: 600, color: '#4ec9b0' }}>{commits.length}</span>
        <span style={{ opacity: 0.7 }}>commits</span>
        <span style={{ opacity: 0.3 }}>•</span>
        <span style={{ fontWeight: 600, color: '#569cd6' }}>{branches.length}</span>
        <span style={{ opacity: 0.7 }}>branches</span>
      </div>

      {/* Floating Bottom-Right Brand Watermark */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          right: 14,
          zIndex: 5,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '3px 8px',
          borderRadius: 10,
          backgroundColor: 'rgba(25, 25, 26, 0.55)',
          backdropFilter: 'blur(6px)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--vscode-foreground, #cccccc)',
          opacity: 0.65,
          userSelect: 'none',
        }}
      >
        <IconTree size={13} color="#4ec9b0" />
        <span>BetterGitGraph</span>
      </div>

      {/* Confirmation Modal */}
      {pendingConfirmOp && (
        <ConfirmDialog
          operation={pendingConfirmOp}
          onConfirm={handleConfirmOperation}
          onCancel={() => setPendingConfirmOp(null)}
        />
      )}
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--vscode-foreground, #cccccc)',
  cursor: 'pointer',
  padding: '4px 8px',
  borderRadius: 4,
  fontSize: 12,
  fontWeight: 'bold',
};

import type { GraphLayout, LayoutNode, LayoutEdge, CommitNodeType } from './dag-layout';
import type { Viewport } from '../../store/store';

export interface RenderOptions {
  selectedHash: string | null;
  hoveredHash: string | null;
  highlightedBranch: string | null;
  filteredHashes: Set<string> | null;
  theme: 'dark' | 'light' | 'high-contrast';
}

export class CanvasRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('Unable to acquire 2D canvas rendering context.');
    }
    this.ctx = context;
  }

  /**
   * Main render method. Applies viewport transformation and culling.
   */
  render(layout: GraphLayout, viewport: Viewport, options: RenderOptions): void {
    const { ctx, canvas } = this;
    const dpr = window.devicePixelRatio || 1;

    // Clear background
    const isDark = options.theme !== 'light';
    ctx.fillStyle = isDark ? '#1e1e1e' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!layout || layout.nodes.length === 0) {
      this.drawEmptyState(canvas.width / dpr, canvas.height / dpr, isDark);
      return;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Apply pan & zoom viewport matrix
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);

    // Calculate visible bounding box in graph coordinates for culling
    const visibleMinX = -viewport.x / viewport.zoom - 50;
    const visibleMaxX = (-viewport.x + viewport.width) / viewport.zoom + 50;
    const visibleMinY = -viewport.y / viewport.zoom - 50;
    const visibleMaxY = (-viewport.y + viewport.height) / viewport.zoom + 50;

    // 1. Draw Edges (with thicker trunk lines for main)
    this.drawEdges(layout.edges, visibleMinX, visibleMaxX, visibleMinY, visibleMaxY, options);

    // 2. Draw Nodes & Human-friendly Labels
    this.drawNodes(layout.nodes, visibleMinX, visibleMaxX, visibleMinY, visibleMaxY, options);

    ctx.restore();
  }

  /**
   * Hit test a screen coordinate (pixels) to find the hovered/clicked commit node.
   */
  hitTest(
    screenX: number,
    screenY: number,
    layout: GraphLayout,
    viewport: Viewport
  ): LayoutNode | null {
    if (!layout || layout.nodes.length === 0) return null;

    const graphX = (screenX - viewport.x) / viewport.zoom;
    const graphY = (screenY - viewport.y) / viewport.zoom;

    const HIT_RADIUS = 18;
    const hitRadiusSq = HIT_RADIUS * HIT_RADIUS;

    for (let i = layout.nodes.length - 1; i >= 0; i--) {
      const node = layout.nodes[i];
      if (!node) continue;

      const dx = graphX - node.x;
      const dy = graphY - node.y;
      if (dx * dx + dy * dy <= hitRadiusSq) {
        return node;
      }
    }

    return null;
  }

  private drawEdges(
    edges: LayoutEdge[],
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
    options: RenderOptions
  ): void {
    const { ctx } = this;

    for (const edge of edges) {
      if (edge.points.length < 2) continue;

      const pFirst = edge.points[0]!;
      const pLast = edge.points[edge.points.length - 1]!;
      const edgeMinX = Math.min(pFirst.x, pLast.x);
      const edgeMaxX = Math.max(pFirst.x, pLast.x);
      const edgeMinY = Math.min(pFirst.y, pLast.y);
      const edgeMaxY = Math.max(pFirst.y, pLast.y);

      if (edgeMaxX < minX || edgeMinX > maxX || edgeMaxY < minY || edgeMinY > maxY) {
        continue; // Culled
      }

      const isDimmed =
        options.filteredHashes &&
        !options.filteredHashes.has(edge.source) &&
        !options.filteredHashes.has(edge.target);

      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = isDimmed ? 'rgba(128, 128, 128, 0.2)' : edge.color;

      // ── Thicker line for main trunk backbone ──────────────────────────────
      ctx.lineWidth = edge.isMainEdge ? 5.0 : 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (edge.points.length === 2) {
        ctx.moveTo(pFirst.x, pFirst.y);
        ctx.lineTo(pLast.x, pLast.y);
      } else {
        ctx.moveTo(pFirst.x, pFirst.y);
        for (let i = 1; i < edge.points.length - 1; i++) {
          const pCurrent = edge.points[i]!;
          const pNext = edge.points[i + 1]!;
          const midX = (pCurrent.x + pNext.x) / 2;
          const midY = (pCurrent.y + pNext.y) / 2;
          ctx.quadraticCurveTo(pCurrent.x, pCurrent.y, midX, midY);
        }
        ctx.lineTo(pLast.x, pLast.y);
      }

      ctx.stroke();
      ctx.restore();
    }
  }

  private drawNodes(
    nodes: LayoutNode[],
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
    options: RenderOptions
  ): void {
    const { ctx } = this;
    const isDark = options.theme !== 'light';

    for (const node of nodes) {
      if (node.x < minX || node.x > maxX || node.y < minY || node.y > maxY) {
        continue; // Culled
      }

      const isSelected = options.selectedHash === node.hash;
      const isHovered = options.hoveredHash === node.hash;
      const isDimmed = options.filteredHashes ? !options.filteredHashes.has(node.hash) : false;

      ctx.save();
      if (isDimmed) {
        ctx.globalAlpha = 0.2;
      }

      const radius = node.radius;

      // ── Outer Selection / Hover Glow Ring ─────────────────────────────────
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + (isSelected ? 7 : 4), 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? 'rgba(78, 201, 176, 0.4)' : 'rgba(255, 255, 255, 0.2)';
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#4ec9b0' : '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // ── Node Body by Type ─────────────────────────────────────────────────
      ctx.beginPath();
      if (node.nodeType === 'merge' || node.nodeType === 'octopus') {
        // Merge commit: distinct double-ring
        ctx.arc(node.x, node.y, radius + 2, 0, Math.PI * 2);
        ctx.fillStyle = node.branchColor;
        ctx.fill();
        ctx.strokeStyle = isDark ? '#1e1e1e' : '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius - 2, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#1e1e1e' : '#ffffff';
        ctx.fill();
      } else if (node.nodeType === 'initial') {
        // Initial Root commit: solid square or distinctive anchor dot
        ctx.arc(node.x, node.y, radius + 1, 0, Math.PI * 2);
        ctx.fillStyle = '#4ec9b0';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Standard commit node
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = node.branchColor;
        ctx.fill();
        ctx.strokeStyle = node.isMainBranch ? '#ffffff' : (isDark ? '#2d2d2d' : '#e0e0e0');
        ctx.lineWidth = node.isMainBranch ? 2 : 1.5;
        ctx.stroke();
      }

      // ── HEAD Pulsing Indicator ────────────────────────────────────────────
      if (node.isHead) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#4ec9b0';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // ── Human-Friendly Node Labels & Badges ───────────────────────────────
      this.drawHumanNodeLabels(node, isDark);

      ctx.restore();
    }
  }

  private drawHumanNodeLabels(node: LayoutNode, isDark: boolean): void {
    const { ctx } = this;
    const startX = node.x + node.radius + 12;
    let currentX = startX;
    const rowY = node.y;

    // 1. Draw Type Badge (Commit / Merge / Initial / Octopus)
    const typeLabel = this.getNodeTypeBadgeLabel(node.nodeType);
    const typeBgColor = this.getNodeTypeBadgeBg(node.nodeType, isDark);
    const typeTextColor = this.getNodeTypeBadgeTextColor(node.nodeType, isDark);

    ctx.font = 'bold 10px sans-serif';
    const typeWidth = ctx.measureText(typeLabel).width + 12;
    const badgeHeight = 16;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(currentX, rowY - badgeHeight / 2, typeWidth, badgeHeight, 3);
    ctx.fillStyle = typeBgColor;
    ctx.fill();
    ctx.fillStyle = typeTextColor;
    ctx.textBaseline = 'middle';
    ctx.fillText(typeLabel, currentX + 6, rowY);
    ctx.restore();

    currentX += typeWidth + 8;

    // 2. Draw Branch / Ref Chips if attached
    for (const ref of node.refs) {
      const isTag = ref.startsWith('tag: ');
      const isHeadRef = ref.includes('HEAD');
      const labelText = ref.replace(/^HEAD -> /, '').replace(/^tag: /, '');

      ctx.font = '11px sans-serif';
      const textWidth = ctx.measureText(labelText).width;
      const badgeWidth = textWidth + 14;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(currentX, rowY - badgeHeight / 2, badgeWidth, badgeHeight, 3);

      if (isTag) {
        ctx.fillStyle = isDark ? '#59441B' : '#FFF3CD';
        ctx.fill();
        ctx.fillStyle = isDark ? '#FFD43B' : '#856404';
      } else if (isHeadRef) {
        ctx.fillStyle = isDark ? '#1B4D3E' : '#D4EDDA';
        ctx.fill();
        ctx.fillStyle = isDark ? '#75B798' : '#155724';
      } else {
        ctx.fillStyle = isDark ? '#2D3748' : '#E2E8F0';
        ctx.fill();
        ctx.fillStyle = isDark ? '#E2E8F0' : '#2D3748';
      }

      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, currentX + 7, rowY);
      ctx.restore();

      currentX += badgeWidth + 6;
    }

    // 3. Draw Title (Commit Subject) — Main Focus
    ctx.save();
    ctx.font = 'bold 12px var(--vscode-font-family, sans-serif)';
    ctx.fillStyle = isDark ? '#ffffff' : '#111111';
    ctx.textBaseline = 'middle';

    const maxSubjectLen = 50;
    const truncatedSubject =
      node.subject.length > maxSubjectLen
        ? `${node.subject.slice(0, maxSubjectLen)}…`
        : node.subject;

    ctx.fillText(truncatedSubject, currentX, rowY);
    const subjectWidth = ctx.measureText(truncatedSubject).width;
    ctx.restore();

    currentX += subjectWidth + 12;

    // 4. Draw Author + Relative Time (No raw SHA!)
    ctx.save();
    ctx.font = '11px var(--vscode-font-family, sans-serif)';
    ctx.fillStyle = isDark ? '#888888' : '#666666';
    ctx.textBaseline = 'middle';
    ctx.fillText(`•  ${node.author}  •  ${node.relativeTime}`, currentX, rowY);
    ctx.restore();
  }

  private getNodeTypeBadgeLabel(type: CommitNodeType): string {
    switch (type) {
      case 'initial':
        return 'INITIAL';
      case 'merge':
        return 'MERGE';
      case 'octopus':
        return 'OCTOPUS';
      case 'stash':
        return 'STASH';
      default:
        return 'COMMIT';
    }
  }

  private getNodeTypeBadgeBg(type: CommitNodeType, isDark: boolean): string {
    switch (type) {
      case 'initial':
        return isDark ? '#144234' : '#d1fae5';
      case 'merge':
      case 'octopus':
        return isDark ? '#3b2064' : '#ede9fe';
      case 'stash':
        return isDark ? '#374151' : '#f3f4f6';
      default:
        return isDark ? '#1e3a5f' : '#dbeafe';
    }
  }

  private getNodeTypeBadgeTextColor(type: CommitNodeType, isDark: boolean): string {
    switch (type) {
      case 'initial':
        return isDark ? '#34d399' : '#065f46';
      case 'merge':
      case 'octopus':
        return isDark ? '#a78bfa' : '#5b21b6';
      case 'stash':
        return isDark ? '#9ca3af' : '#4b5563';
      default:
        return isDark ? '#60a5fa' : '#1e40af';
    }
  }

  private drawEmptyState(width: number, height: number, isDark: boolean): void {
    const { ctx } = this;
    ctx.save();
    ctx.fillStyle = isDark ? '#888888' : '#666666';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No commits to display. Open a Git repository with commit history.', width / 2, height / 2);
    ctx.restore();
  }
}

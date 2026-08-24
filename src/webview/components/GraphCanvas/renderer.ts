import type { GraphLayout, LayoutNode, LayoutEdge } from './dag-layout';
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
    // Scale for high DPI
    ctx.scale(dpr, dpr);

    // Apply pan & zoom viewport matrix
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);

    // Calculate visible bounding box in graph coordinates for culling
    const visibleMinX = -viewport.x / viewport.zoom - 50;
    const visibleMaxX = (-viewport.x + viewport.width) / viewport.zoom + 50;
    const visibleMinY = -viewport.y / viewport.zoom - 50;
    const visibleMaxY = (-viewport.y + viewport.height) / viewport.zoom + 50;

    // 1. Draw Edges
    this.drawEdges(layout.edges, visibleMinX, visibleMaxX, visibleMinY, visibleMaxY, options);

    // 2. Draw Nodes & Labels
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

    // Transform screen coordinate to graph space
    const graphX = (screenX - viewport.x) / viewport.zoom;
    const graphY = (screenY - viewport.y) / viewport.zoom;

    // Check nodes (hit radius 16px for easy touch/mouse click)
    const HIT_RADIUS = 16;
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

      // Simple bounding box check for edge culling
      const pFirst = edge.points[0]!;
      const pLast = edge.points[edge.points.length - 1]!;
      const edgeMinX = Math.min(pFirst.x, pLast.x);
      const edgeMaxX = Math.max(pFirst.x, pLast.x);
      const edgeMinY = Math.min(pFirst.y, pLast.y);
      const edgeMaxY = Math.max(pFirst.y, pLast.y);

      if (edgeMaxX < minX || edgeMinX > maxX || edgeMaxY < minY || edgeMinY > maxY) {
        continue; // Culled
      }

      const isDimmed = options.filteredHashes && (!options.filteredHashes.has(edge.source) && !options.filteredHashes.has(edge.target));

      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = isDimmed ? 'rgba(128, 128, 128, 0.2)' : edge.color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (edge.points.length === 2) {
        // Straight line
        ctx.moveTo(pFirst.x, pFirst.y);
        ctx.lineTo(pLast.x, pLast.y);
      } else {
        // Smooth spline through Dagre waypoints
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
        ctx.arc(node.x, node.y, radius + (isSelected ? 6 : 4), 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? 'rgba(78, 201, 176, 0.35)' : 'rgba(255, 255, 255, 0.18)';
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#4ec9b0' : '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // ── Node Circle / Shape ───────────────────────────────────────────────
      ctx.beginPath();
      if (node.isMerge) {
        // Merge commit: double-ring node
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
      } else {
        // Standard commit node
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = node.branchColor;
        ctx.fill();
        ctx.strokeStyle = isDark ? '#2d2d2d' : '#e0e0e0';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // ── HEAD Indicator ───────────────────────────────────────────────────
      if (node.isHead) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = '#4ec9b0';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // ── Ref Chips & Subject Label ────────────────────────────────────────
      this.drawNodeLabels(node, isDark);

      ctx.restore();
    }
  }

  private drawNodeLabels(node: LayoutNode, isDark: boolean): void {
    const { ctx } = this;
    const startX = node.x + node.radius + 12;
    let currentX = startX;
    const badgeY = node.y;

    // 1. Draw Ref Badges (Branches, Tags, HEAD)
    for (const ref of node.refs) {
      const isTag = ref.startsWith('tag: ');
      const isHeadRef = ref.includes('HEAD');
      const labelText = ref.replace(/^HEAD -> /, '').replace(/^tag: /, '');

      ctx.font = '11px sans-serif';
      const textWidth = ctx.measureText(labelText).width;
      const badgeWidth = textWidth + 16;
      const badgeHeight = 18;

      ctx.save();
      // Badge pill background
      ctx.beginPath();
      const rx = currentX;
      const ry = badgeY - badgeHeight / 2;
      ctx.roundRect(rx, ry, badgeWidth, badgeHeight, 4);

      if (isTag) {
        ctx.fillStyle = isDark ? '#59441B' : '#FFF3CD';
        ctx.fill();
        ctx.strokeStyle = '#E5A50A';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = isDark ? '#FFD43B' : '#856404';
      } else if (isHeadRef) {
        ctx.fillStyle = isDark ? '#1B4D3E' : '#D4EDDA';
        ctx.fill();
        ctx.strokeStyle = '#28A745';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = isDark ? '#75B798' : '#155724';
      } else {
        ctx.fillStyle = isDark ? '#2D3748' : '#E2E8F0';
        ctx.fill();
        ctx.strokeStyle = node.branchColor;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = isDark ? '#E2E8F0' : '#2D3748';
      }

      // Badge text
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, currentX + 8, badgeY);
      ctx.restore();

      currentX += badgeWidth + 6;
    }

    // 2. Draw Commit Subject & Short Hash Preview
    ctx.save();
    ctx.font = '12px var(--vscode-font-family, sans-serif)';
    ctx.fillStyle = isDark ? '#d4d4d4' : '#333333';
    ctx.textBaseline = 'middle';

    const maxSubjectLen = 60;
    const truncatedSubject =
      node.subject.length > maxSubjectLen
        ? `${node.subject.slice(0, maxSubjectLen)}…`
        : node.subject;

    ctx.fillText(`${node.shortHash}  ${truncatedSubject}`, currentX, badgeY);
    ctx.restore();
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

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
   * Main render method. Applies viewport transformation, culling, and rendering.
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
    const visibleMinX = -viewport.x / viewport.zoom - 100;
    const visibleMaxX = (-viewport.x + viewport.width) / viewport.zoom + 100;
    const visibleMinY = -viewport.y / viewport.zoom - 100;
    const visibleMaxY = (-viewport.y + viewport.height) / viewport.zoom + 100;

    // 1. Draw Edges
    this.drawEdges(layout.edges, visibleMinX, visibleMaxX, visibleMinY, visibleMaxY, options);

    // 2. Draw Plaques (Tag Cards)
    this.drawPlaques(layout.nodes, visibleMinX, visibleMaxX, visibleMinY, visibleMaxY, options, viewport.zoom);

    // 3. Draw Nodes
    this.drawNodes(layout.nodes, visibleMinX, visibleMaxX, visibleMinY, visibleMaxY, options);

    ctx.restore();
  }

  /**
   * Hit test a screen coordinate (pixels) to find the hovered/clicked commit node or plaque.
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

      // 1. Test Node Circle
      const dx = graphX - node.x;
      const dy = graphY - node.y;
      if (dx * dx + dy * dy <= hitRadiusSq) {
        return node;
      }

      // 2. Test Plaque Bounding Box
      const { plaque } = node;
      if (
        plaque &&
        graphX >= plaque.x &&
        graphX <= plaque.x + plaque.width &&
        graphY >= plaque.y &&
        graphY <= plaque.y + plaque.height
      ) {
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
        continue;
      }

      const isDimmed =
        options.filteredHashes &&
        !options.filteredHashes.has(edge.source) &&
        !options.filteredHashes.has(edge.target);

      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = isDimmed ? 'rgba(128, 128, 128, 0.2)' : edge.color;
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

  private drawPlaques(
    nodes: LayoutNode[],
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
    options: RenderOptions,
    zoom: number
  ): void {
    // When zoomed out too far, hide plaques to maintain clean overview
    if (zoom < 0.35) return;

    const { ctx } = this;
    const isDark = options.theme !== 'light';

    for (const node of nodes) {
      const { plaque } = node;
      if (!plaque) continue;

      if (
        plaque.x + plaque.width < minX ||
        plaque.x > maxX ||
        plaque.y + plaque.height < minY ||
        plaque.y > maxY
      ) {
        continue;
      }

      const isSelected = options.selectedHash === node.hash;
      const isHovered = options.hoveredHash === node.hash;
      const isDimmed = options.filteredHashes ? !options.filteredHashes.has(node.hash) : false;

      ctx.save();
      if (isDimmed) {
        ctx.globalAlpha = 0.2;
      }

      // 1. Draw Connector Stem Line from Node to Plaque
      ctx.beginPath();
      ctx.strokeStyle = isSelected ? '#4ec9b0' : node.branchColor;
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.setLineDash([2, 2]);

      if (plaque.placement === 'top') {
        ctx.moveTo(node.x, node.y - node.radius);
        ctx.lineTo(node.x, plaque.y + plaque.height);
      } else if (plaque.placement === 'bottom') {
        ctx.moveTo(node.x, node.y + node.radius);
        ctx.lineTo(node.x, plaque.y);
      } else {
        ctx.moveTo(node.x + node.radius, node.y);
        ctx.lineTo(plaque.x, node.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 2. Draw Plaque Container (Card)
      const plaqueBg = isDark
        ? (isSelected ? '#2d2d30' : '#252526')
        : (isSelected ? '#e8f4fc' : '#f8f9fa');
      const borderColor = isSelected
        ? '#4ec9b0'
        : isHovered
        ? (isDark ? '#888888' : '#aaaaaa')
        : (isDark ? '#3c3c3c' : '#d0d7de');

      ctx.beginPath();
      ctx.roundRect(plaque.x, plaque.y, plaque.width, plaque.height, 6);
      ctx.fillStyle = plaqueBg;
      ctx.fill();
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = isSelected ? 1.8 : 1;
      ctx.stroke();

      // 3. Draw Type Badge Pill
      const typeLabel = this.getNodeTypeBadgeLabel(node.nodeType);
      const typeBgColor = this.getNodeTypeBadgeBg(node.nodeType, isDark);
      const typeTextColor = this.getNodeTypeBadgeTextColor(node.nodeType, isDark);

      ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      const typeWidth = ctx.measureText(typeLabel).width + 10;
      const badgeX = plaque.x + 8;
      const badgeY = plaque.y + 6;

      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, typeWidth, 16, 3);
      ctx.fillStyle = typeBgColor;
      ctx.fill();
      ctx.fillStyle = typeTextColor;
      ctx.textBaseline = 'middle';
      ctx.fillText(typeLabel, badgeX + 5, badgeY + 8);

      // 4. Draw Title (Subject)
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = isDark ? '#ffffff' : '#111111';
      ctx.textBaseline = 'middle';

      const titleX = badgeX + typeWidth + 8;
      const maxTitleWidth = plaque.width - (titleX - plaque.x) - 8;
      const truncatedTitle = this.truncateTextToWidth(node.subject, maxTitleWidth, ctx);

      ctx.fillText(truncatedTitle, titleX, badgeY + 8);

      // 5. Draw Author & Date
      ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillStyle = isDark ? '#888888' : '#666666';
      const subText = `${node.author}  •  ${node.formattedDate || node.relativeTime}`;
      const truncatedSub = this.truncateTextToWidth(subText, plaque.width - 16, ctx);
      ctx.fillText(truncatedSub, plaque.x + 8, plaque.y + 30);

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
        continue;
      }

      const isSelected = options.selectedHash === node.hash;
      const isHovered = options.hoveredHash === node.hash;
      const isDimmed = options.filteredHashes ? !options.filteredHashes.has(node.hash) : false;

      ctx.save();
      if (isDimmed) {
        ctx.globalAlpha = 0.2;
      }

      const radius = node.radius;

      // Outer Selection Glow Ring
      if (isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + (isSelected ? 7 : 4), 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? 'rgba(78, 201, 176, 0.4)' : 'rgba(255, 255, 255, 0.2)';
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#4ec9b0' : '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Node Body
      ctx.beginPath();
      if (node.nodeType === 'merge' || node.nodeType === 'octopus') {
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
        ctx.arc(node.x, node.y, radius + 1, 0, Math.PI * 2);
        ctx.fillStyle = '#4ec9b0';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = node.branchColor;
        ctx.fill();
        ctx.strokeStyle = node.isMainBranch ? '#ffffff' : (isDark ? '#2d2d2d' : '#e0e0e0');
        ctx.lineWidth = node.isMainBranch ? 2 : 1.5;
        ctx.stroke();
      }

      // HEAD Indicator
      if (node.isHead) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#4ec9b0';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();
    }
  }

  private truncateTextToWidth(text: string, maxWidth: number, ctx: CanvasRenderingContext2D): string {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let low = 0;
    let high = text.length;
    let best = text;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const slice = `${text.slice(0, mid)}…`;
      if (ctx.measureText(slice).width <= maxWidth) {
        best = slice;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return best;
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

import type { GraphLayout, LayoutNode, LayoutEdge } from '../components/GraphCanvas/dag-layout';

export interface SvgExportOptions {
  theme?: 'dark' | 'light';
  title?: string;
}

/**
 * Generates a standalone, valid XML SVG string from a computed GraphLayout.
 */
export function exportGraphToSvg(
  layout: GraphLayout,
  options: SvgExportOptions = {}
): string {
  const isDark = options.theme !== 'light';
  const padding = 60;

  const minX = layout.bounds.minX - padding;
  const minY = layout.bounds.minY - padding;
  const maxX = layout.bounds.maxX + padding;
  const maxY = layout.bounds.maxY + padding;

  const width = Math.max(800, maxX - minX);
  const height = Math.max(600, maxY - minY);

  const bgColor = isDark ? '#1e1e1e' : '#ffffff';
  const textColor = isDark ? '#cccccc' : '#222222';
  const titleColor = isDark ? '#ffffff' : '#000000';
  const subtextColor = isDark ? '#888888' : '#666666';

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <style>
      .bg { fill: ${bgColor}; }
      .text-title { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 12px; font-weight: bold; fill: ${titleColor}; }
      .text-sub { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 11px; fill: ${subtextColor}; }
      .text-badge { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 9px; font-weight: bold; }
    </style>
  </defs>

  <!-- Background -->
  <rect x="${minX}" y="${minY}" width="${width}" height="${height}" class="bg" />
`;

  // 1. Render Edges
  svg += `  <!-- Edges -->\n  <g id="edges">\n`;
  for (const edge of layout.edges) {
    if (edge.points.length < 2) continue;

    const strokeWidth = edge.isMainEdge ? 5.0 : 2.5;
    let pathD = `M ${edge.points[0]!.x} ${edge.points[0]!.y}`;

    if (edge.points.length === 2) {
      pathD += ` L ${edge.points[1]!.x} ${edge.points[1]!.y}`;
    } else {
      for (let i = 1; i < edge.points.length - 1; i++) {
        const pCurrent = edge.points[i]!;
        const pNext = edge.points[i + 1]!;
        const midX = (pCurrent.x + pNext.x) / 2;
        const midY = (pCurrent.y + pNext.y) / 2;
        pathD += ` Q ${pCurrent.x} ${pCurrent.y} ${midX} ${midY}`;
      }
      const last = edge.points[edge.points.length - 1]!;
      pathD += ` L ${last.x} ${last.y}`;
    }

    svg += `    <path d="${pathD}" fill="none" stroke="${edge.color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" opacity="0.9" />\n`;
  }
  svg += `  </g>\n\n`;

  // 2. Render Plaques
  svg += `  <!-- Plaques -->\n  <g id="plaques">\n`;
  for (const node of layout.nodes) {
    if (!node.plaque) continue;
    const { plaque } = node;

    // Connector line from node to plaque
    svg += `    <line x1="${node.x}" y1="${node.y}" x2="${plaque.x}" y2="${plaque.y + plaque.height / 2}" stroke="${node.branchColor}" stroke-width="1.5" stroke-dasharray="2,2" opacity="0.6" />\n`;

    // Plaque background container
    const plaqueBg = isDark ? '#252526' : '#f3f4f6';
    const plaqueBorder = node.isMainBranch ? '#4ec9b0' : node.branchColor;

    svg += `    <rect x="${plaque.x}" y="${plaque.y}" width="${plaque.width}" height="${plaque.height}" rx="6" fill="${plaqueBg}" stroke="${plaqueBorder}" stroke-width="1.2" opacity="0.95" />\n`;

    // Badge
    const badgeText = node.nodeType.toUpperCase();
    const badgeBg = node.isMainBranch ? '#144234' : '#1e3a5f';
    const badgeFg = node.isMainBranch ? '#34d399' : '#60a5fa';

    svg += `    <rect x="${plaque.x + 8}" y="${plaque.y + 6}" width="54" height="16" rx="3" fill="${badgeBg}" />\n`;
    svg += `    <text x="${plaque.x + 35}" y="${plaque.y + 18}" text-anchor="middle" class="text-badge" fill="${badgeFg}">${escapeXml(badgeText)}</text>\n`;

    // Title / Subject
    const maxSubjectLen = 42;
    const subject = node.subject.length > maxSubjectLen ? `${node.subject.slice(0, maxSubjectLen)}…` : node.subject;
    svg += `    <text x="${plaque.x + 70}" y="${plaque.y + 18}" class="text-title">${escapeXml(subject)}</text>\n`;

    // Author & Timestamp
    const subText = `${node.author} • ${node.formattedDate || node.relativeTime}`;
    svg += `    <text x="${plaque.x + 70}" y="${plaque.y + 34}" class="text-sub">${escapeXml(subText)}</text>\n`;
  }
  svg += `  </g>\n\n`;

  // 3. Render Nodes
  svg += `  <!-- Nodes -->\n  <g id="nodes">\n`;
  for (const node of layout.nodes) {
    const radius = node.radius;

    if (node.nodeType === 'merge' || node.nodeType === 'octopus') {
      svg += `    <circle cx="${node.x}" cy="${node.y}" r="${radius + 2}" fill="${node.branchColor}" stroke="${bgColor}" stroke-width="2" />\n`;
      svg += `    <circle cx="${node.x}" cy="${node.y}" r="${radius - 2}" fill="${bgColor}" />\n`;
    } else if (node.nodeType === 'initial') {
      svg += `    <circle cx="${node.x}" cy="${node.y}" r="${radius + 1}" fill="#4ec9b0" stroke="#ffffff" stroke-width="2" />\n`;
    } else {
      svg += `    <circle cx="${node.x}" cy="${node.y}" r="${radius}" fill="${node.branchColor}" stroke="${node.isMainBranch ? '#ffffff' : (isDark ? '#2d2d2d' : '#e0e0e0')}" stroke-width="${node.isMainBranch ? 2 : 1.5}" />\n`;
    }

    if (node.isHead) {
      svg += `    <circle cx="${node.x}" cy="${node.y}" r="${radius + 5}" fill="none" stroke="#4ec9b0" stroke-width="2" stroke-dasharray="3,3" />\n`;
    }
  }
  svg += `  </g>\n`;

  svg += `</svg>`;
  return svg;
}

/**
 * Triggers a browser download of an SVG file.
 */
export function downloadSvg(svgContent: string, filename = 'bettergitgraph-repo-map.svg'): void {
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Triggers a download of a PNG snapshot of the canvas.
 */
export function downloadCanvasPng(canvas: HTMLCanvasElement, filename = 'bettergitgraph-repo-map.png'): void {
  const url = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

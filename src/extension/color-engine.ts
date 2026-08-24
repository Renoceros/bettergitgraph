/**
 * BranchColorEngine
 *
 * Deterministically maps a branch name → an HSL color string.
 * Algorithm:
 *   1. FNV-1a hash the branch name (fast, good hue distribution)
 *   2. hue = hash % 360
 *   3. saturation = 70% (vivid but not garish)
 *   4. lightness = 55% for dark themes, 40% for light themes
 *
 * Overrides are stored in .vscode/bettergitgraph.json.
 */
export class BranchColorEngine {
  private overrides = new Map<string, string>();
  private theme: 'dark' | 'light' | 'high-contrast';

  constructor(
    theme: 'dark' | 'light' | 'high-contrast' = 'dark'
  ) {
    this.theme = theme;
  }

  getColor(branchName: string): string {
    if (this.overrides.has(branchName)) {
      return this.overrides.get(branchName)!;
    }
    const hue = fnv1a(branchName) % 360;
    const saturation = 70;
    const lightness = this.theme === 'light' ? 40 : 55;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  setOverride(branchName: string, color: string): void {
    this.overrides.set(branchName, color);
  }

  removeOverride(branchName: string): void {
    this.overrides.delete(branchName);
  }

  setTheme(theme: 'dark' | 'light' | 'high-contrast'): void {
    this.theme = theme;
  }

  getAllColors(branchNames: string[]): Map<string, string> {
    return new Map(branchNames.map((name) => [name, this.getColor(name)]));
  }
}

// ─── FNV-1a 32-bit ────────────────────────────────────────────────────────────

function fnv1a(str: string): number {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    // Multiply by FNV prime (32-bit, keep within safe integer range)
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash;
}

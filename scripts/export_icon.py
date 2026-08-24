#!/usr/bin/env python3
"""
scripts/export_icon.py
Exports resources/icon.svg to an exact 128x128 PNG image with anti-aliasing.
"""

import os
import sys
import subprocess
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow is required. Run 'pip install Pillow'.", file=sys.stderr)
    sys.exit(1)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SVG_PATH = PROJECT_ROOT / "resources" / "icon.svg"
PNG_PATH = PROJECT_ROOT / "resources" / "icon.png"
TEMP_PNG = PROJECT_ROOT / "resources" / "icon.svg.png"

def export_icon(target_size: int = 128) -> None:
    if not SVG_PATH.exists():
        print(f"Error: SVG not found at {SVG_PATH}", file=sys.stderr)
        sys.exit(1)

    print(f"Rendering {SVG_PATH.name} to {PNG_PATH.name} ({target_size}x{target_size})...")

    # Render high-resolution raster via macOS QuickLook
    render_size = target_size * 4  # 512px for super-sampling anti-aliasing
    cmd = [
        "qlmanage",
        "-t",
        "-s",
        str(render_size),
        "-o",
        str(PROJECT_ROOT / "resources"),
        str(SVG_PATH),
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

    if not TEMP_PNG.exists():
        print("Error: Thumbnail generation failed.", file=sys.stderr)
        sys.exit(1)

    # Downsample cleanly using Lanczos interpolation
    with Image.open(TEMP_PNG) as img:
        img = img.convert("RGBA")
        resized = img.resize((target_size, target_size), Image.Resampling.LANCZOS)
        resized.save(PNG_PATH, "PNG", optimize=True)

    # Clean up temporary raster
    if TEMP_PNG.exists():
        os.remove(TEMP_PNG)

    with Image.open(PNG_PATH) as final_img:
        w, h = final_img.size
        print(f"✅ Successfully exported: {PNG_PATH} ({w}x{h} PNG, mode={final_img.mode})")

if __name__ == "__main__":
    export_icon(128)

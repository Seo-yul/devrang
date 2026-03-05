#!/usr/bin/env python3
"""
Flood-fill background removal for pixel-art tiger images.
Starts from 4 corners, removes pixels similar to background color.
Preserves flag interior white by stopping at outline edges.
"""
import os
from collections import deque
from PIL import Image
import numpy as np

SRC_DIR = os.path.join(os.path.dirname(__file__), '..')
DST_DIR = os.path.join(SRC_DIR, 'assets')
os.makedirs(DST_DIR, exist_ok=True)

FILES = ['tiger.png', 'tiger-macbook.png', 'tiger-coffee.png', 'tiger-bag.png']

# Background color tolerance (Euclidean distance in RGB space)
TOLERANCE = 35


def color_distance(c1, c2):
    return ((int(c1[0]) - int(c2[0])) ** 2 +
            (int(c1[1]) - int(c2[1])) ** 2 +
            (int(c1[2]) - int(c2[2])) ** 2) ** 0.5


def flood_fill_remove_bg(img_array, alpha, start_x, start_y, bg_color, tolerance):
    """Flood fill from a starting point, making similar-colored pixels transparent."""
    h, w = img_array.shape[:2]
    visited = set()
    queue = deque()
    queue.append((start_x, start_y))
    visited.add((start_x, start_y))

    while queue:
        x, y = queue.popleft()
        pixel = img_array[y, x]
        if color_distance(pixel[:3], bg_color) <= tolerance:
            alpha[y, x] = 0
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in visited:
                    visited.add((nx, ny))
                    queue.append((nx, ny))


def process_image(filename):
    src_path = os.path.join(SRC_DIR, filename)
    dst_path = os.path.join(DST_DIR, filename)

    img = Image.open(src_path).convert('RGBA')
    arr = np.array(img)
    h, w = arr.shape[:2]

    # Sample background color from top-left corner
    bg_color = tuple(arr[5, 5, :3])
    print(f"  Background color sampled: {bg_color}")

    # Create alpha channel (start fully opaque)
    alpha = arr[:, :, 3].copy()

    # Flood fill from 4 corners
    corners = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    for cx, cy in corners:
        print(f"  Flood filling from ({cx}, {cy})...")
        flood_fill_remove_bg(arr, alpha, cx, cy, bg_color, TOLERANCE)

    # Also seed from edge midpoints for better coverage
    edge_seeds = [
        (w // 2, 0), (w // 2, h - 1),  # top/bottom center
        (0, h // 2), (w - 1, h // 2),    # left/right center
        (w // 4, 0), (3 * w // 4, 0),    # top quarter points
        (w // 4, h - 1), (3 * w // 4, h - 1),  # bottom quarter points
    ]
    for sx, sy in edge_seeds:
        if alpha[sy, sx] == 255:  # only if not already transparent
            pixel = arr[sy, sx]
            if color_distance(pixel[:3], bg_color) <= TOLERANCE:
                print(f"  Flood filling from edge seed ({sx}, {sy})...")
                flood_fill_remove_bg(arr, alpha, sx, sy, bg_color, TOLERANCE)

    arr[:, :, 3] = alpha
    result = Image.fromarray(arr)
    result.save(dst_path)
    print(f"  Saved: {dst_path}")

    # Stats
    total_pixels = w * h
    transparent = np.sum(alpha == 0)
    print(f"  Transparent: {transparent}/{total_pixels} ({100*transparent/total_pixels:.1f}%)")


def main():
    for f in FILES:
        print(f"\nProcessing {f}...")
        process_image(f)
    print("\nDone! Check assets/ folder.")


if __name__ == '__main__':
    main()

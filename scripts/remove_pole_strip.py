#!/usr/bin/env python3
"""
Remove white strip between pole and flag.
Finds near-white connected components with size 500-5000 and aspect_ratio > 3,
then sets their alpha to 0.
"""
import os
import numpy as np
from PIL import Image
from collections import deque

ASSETS_DIR = os.path.join(os.path.dirname(__file__), '..', 'assets')
FILES = ['tiger.png', 'tiger-bag.png', 'tiger-coffee.png', 'tiger-macbook.png']

WHITE_THRESHOLD = 200  # RGB channels all above this = near-white
MIN_SIZE = 500
MAX_SIZE = 5000
MIN_ASPECT_RATIO = 3.0


def find_white_components(arr):
    """Find connected components of near-white, opaque pixels."""
    h, w = arr.shape[:2]
    r, g, b, a = arr[:,:,0], arr[:,:,1], arr[:,:,2], arr[:,:,3]

    # near-white and opaque
    mask = (r >= WHITE_THRESHOLD) & (g >= WHITE_THRESHOLD) & (b >= WHITE_THRESHOLD) & (a > 0)

    visited = np.zeros((h, w), dtype=bool)
    components = []

    for y in range(h):
        for x in range(w):
            if mask[y, x] and not visited[y, x]:
                # BFS to find connected component
                comp = []
                queue = deque([(x, y)])
                visited[y, x] = True
                while queue:
                    cx, cy = queue.popleft()
                    comp.append((cx, cy))
                    for dx, dy in [(-1,0),(1,0),(0,-1),(0,1)]:
                        nx, ny = cx+dx, cy+dy
                        if 0 <= nx < w and 0 <= ny < h and not visited[ny, nx] and mask[ny, nx]:
                            visited[ny, nx] = True
                            queue.append((nx, ny))
                components.append(comp)

    return components


def process_image(filename):
    path = os.path.join(ASSETS_DIR, filename)
    img = Image.open(path).convert('RGBA')
    arr = np.array(img)

    components = find_white_components(arr)

    removed = 0
    for comp in components:
        size = len(comp)
        if not (MIN_SIZE <= size <= MAX_SIZE):
            continue

        xs = [p[0] for p in comp]
        ys = [p[1] for p in comp]
        bbox_w = max(xs) - min(xs) + 1
        bbox_h = max(ys) - min(ys) + 1
        aspect = bbox_h / max(bbox_w, 1)

        if aspect >= MIN_ASPECT_RATIO:
            print(f"  Found pole strip: size={size}, bbox=({min(xs)},{min(ys)})-({max(xs)},{max(ys)}), "
                  f"w={bbox_w}, h={bbox_h}, aspect={aspect:.1f}")
            for x, y in comp:
                arr[y, x, 3] = 0
            removed += 1

    if removed > 0:
        result = Image.fromarray(arr)
        result.save(path)
        print(f"  Removed {removed} strip(s), saved.")
    else:
        print(f"  No matching strips found.")

    # Verification
    # Check flag interior preserved
    if arr.shape[0] > 400 and arr.shape[1] > 350:
        flag_alpha = arr[400, 350, 3]
        print(f"  Verification: flag interior (350,400) alpha={flag_alpha}")


def main():
    for f in FILES:
        print(f"\nProcessing {f}...")
        process_image(f)
    print("\nDone!")


if __name__ == '__main__':
    main()

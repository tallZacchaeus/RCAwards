#!/usr/bin/env bash
# Optimize JPGs for web: downscale to a max long edge (never upscale) and
# re-encode at a target quality. macOS `sips` only (no ImageMagick needed).
#
# Usage: scripts/optimize-images.sh <src-dir> <dst-dir> [maxdim] [quality]
# In-place is supported (src-dir == dst-dir).
set -euo pipefail
SRC="${1:?src dir}"; DST="${2:?dst dir}"; MAX="${3:-1600}"; Q="${4:-76}"
mkdir -p "$DST"
shopt -s nullglob nocaseglob
count=0
for f in "$SRC"/*.jpg "$SRC"/*.jpeg "$SRC"/*.png; do
  [ -f "$f" ] || continue
  out="$DST/$(basename "${f%.*}").jpg"
  w=$(sips -g pixelWidth "$f" 2>/dev/null | awk '/pixelWidth/{print $2}')
  h=$(sips -g pixelHeight "$f" 2>/dev/null | awk '/pixelHeight/{print $2}')
  long=$(( w > h ? w : h ))
  [ "$f" = "$out" ] || cp "$f" "$out"
  if [ "$long" -gt "$MAX" ]; then sips -Z "$MAX" "$out" >/dev/null 2>&1; fi
  sips -s format jpeg -s formatOptions "$Q" "$out" >/dev/null 2>&1
  count=$((count+1))
done
echo "optimized $count image(s) → $DST"

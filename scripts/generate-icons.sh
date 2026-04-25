#!/bin/sh
set -e
cd "$(dirname "$0")/../extension/images"

rsvg-convert -w 512 -h 512 icon.svg -o icon-512.png
sips -z 128 128 icon-512.png --out icon-128.png
sips -z 48  48  icon-512.png --out icon-48.png
sips -z 16  16  icon-512.png --out icon-16.png

echo "Generated icon-512.png, icon-128.png, icon-48.png, icon-16.png"

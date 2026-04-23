#!/bin/bash
set -e
cd "$(dirname "$0")/extension"
rm -f ../google-photos-swiper.zip
zip -r ../google-photos-swiper.zip . -x "*.DS_Store"
echo "Created google-photos-swiper.zip ($(du -sh ../google-photos-swiper.zip | cut -f1))"

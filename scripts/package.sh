#!/usr/bin/env bash
# Rebuild and repackage the drag-and-drop deployment zip.
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build
rm -rf .deploy mi-birthday-site.zip
mkdir -p .deploy/mi-birthday-site
cp -r dist/. .deploy/mi-birthday-site/
( cd .deploy && zip -qr ../mi-birthday-site.zip mi-birthday-site )
rm -rf .deploy
echo "wrote mi-birthday-site.zip ($(du -h mi-birthday-site.zip | cut -f1))"

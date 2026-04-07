#!/bin/bash
# Build Storybook and deploy to public/storybook with base href for subpath hosting

set -e

# Check Node.js version — Storybook requires 20.19+ or 22.12+
NODE_MAJOR=$(node -e "console.log(process.versions.node.split('.')[0])")
NODE_MINOR=$(node -e "console.log(process.versions.node.split('.')[1])")

if [ "$NODE_MAJOR" -lt 20 ] || ([ "$NODE_MAJOR" -eq 20 ] && [ "$NODE_MINOR" -lt 19 ]); then
  echo "⚠ Skipping Storybook build: Node.js $(node -v) is too old (requires 20.19+ or 22.12+)"
  exit 0
fi

# Build
npx storybook build

# Inject <base href="/storybook/"> into both HTML files
for file in storybook-static/index.html storybook-static/iframe.html; do
  sed -i 's|<head>|<head><base href="/storybook/">|' "$file"
done

# Copy to public
rm -rf public/storybook
cp -r storybook-static public/storybook
rm -rf storybook-static

echo "Storybook built to public/storybook/"

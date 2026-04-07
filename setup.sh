#!/usr/bin/env bash
# ============================================================
# DK-Launchpad Setup Script
# Initializes a new project from this template.
# Run: bash setup.sh
# ============================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RESET='\033[0m'

echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${RESET}"
echo -e "${CYAN}║       DK-Launchpad Setup Wizard      ║${RESET}"
echo -e "${CYAN}╚══════════════════════════════════════╝${RESET}"
echo ""

# ── Step 1: Project name ──────────────────────────────────

read -p "$(echo -e ${YELLOW}Project name ${RESET}[e.g. My SaaS App]: )" PROJECT_TITLE
PROJECT_TITLE="${PROJECT_TITLE:-My SaaS App}"

# Derive slug (lowercase, hyphens)
PROJECT_SLUG=$(echo "$PROJECT_TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/-\+/-/g' | sed 's/^-\|-$//g')

echo ""
echo -e "  Name  : ${GREEN}${PROJECT_TITLE}${RESET}"
echo -e "  Slug  : ${GREEN}${PROJECT_SLUG}${RESET}"

# ── Step 2: Brand color ───────────────────────────────────

echo ""
echo "Brand color (OKLCh format — lightness chroma hue)"
echo "Examples: 0.45 0.16 270 (indigo), 0.38 0.18 300 (purple), 0.42 0.20 220 (blue)"
read -p "$(echo -e ${YELLOW}Brand color ${RESET}[default: 0.45 0.16 270]: )" BRAND_COLOR
BRAND_COLOR="${BRAND_COLOR:-0.45 0.16 270}"

# ── Step 3: Apply changes ─────────────────────────────────

echo ""
echo -e "${CYAN}Applying changes...${RESET}"

# package.json name
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s/\"dk-launchpad\"/\"${PROJECT_SLUG}\"/" package.json
else
  sed -i "s/\"dk-launchpad\"/\"${PROJECT_SLUG}\"/" package.json
fi
echo "  ✓ package.json name → ${PROJECT_SLUG}"

# layout.tsx title
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s/{{PROJECT_NAME}}/${PROJECT_TITLE}/g" src/app/layout.tsx
  sed -i '' "s/{{PROJECT_DESCRIPTION}}/${PROJECT_TITLE}/g" src/app/layout.tsx
else
  sed -i "s/{{PROJECT_NAME}}/${PROJECT_TITLE}/g" src/app/layout.tsx
  sed -i "s/{{PROJECT_DESCRIPTION}}/${PROJECT_TITLE}/g" src/app/layout.tsx
fi
echo "  ✓ App metadata → ${PROJECT_TITLE}"

# Sidebar project name
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s/__PROJECT_NAME__/${PROJECT_TITLE}/g" src/components/layout/app-sidebar.tsx
else
  sed -i "s/__PROJECT_NAME__/${PROJECT_TITLE}/g" src/components/layout/app-sidebar.tsx
fi
echo "  ✓ Sidebar name → ${PROJECT_TITLE}"

# CLAUDE.md placeholders
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s/{{PROJECT_NAME}}/${PROJECT_TITLE}/g" CLAUDE.md
  sed -i '' "s/{{PROJECT_SLUG}}/${PROJECT_SLUG}/g" CLAUDE.md
else
  sed -i "s/{{PROJECT_NAME}}/${PROJECT_TITLE}/g" CLAUDE.md
  sed -i "s/{{PROJECT_SLUG}}/${PROJECT_SLUG}/g" CLAUDE.md
fi
echo "  ✓ CLAUDE.md updated"

# Brand colors in globals.css
# Replace primary color (light mode)
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s/--primary: oklch(0.45 0.16 270);/--primary: oklch(${BRAND_COLOR});/" src/app/globals.css
  sed -i '' "s/--ring: oklch(0.45 0.16 270);/--ring: oklch(${BRAND_COLOR});/" src/app/globals.css
  sed -i '' "s/--sidebar-primary: oklch(0.45 0.16 270);/--sidebar-primary: oklch(${BRAND_COLOR});/" src/app/globals.css
  sed -i '' "s/--sidebar-accent: oklch(0.45 0.16 270);/--sidebar-accent: oklch(${BRAND_COLOR});/" src/app/globals.css
  sed -i '' "s/--sidebar-ring: oklch(0.45 0.16 270);/--sidebar-ring: oklch(${BRAND_COLOR});/" src/app/globals.css
else
  sed -i "s/--primary: oklch(0.45 0.16 270);/--primary: oklch(${BRAND_COLOR});/" src/app/globals.css
  sed -i "s/--ring: oklch(0.45 0.16 270);/--ring: oklch(${BRAND_COLOR});/" src/app/globals.css
  sed -i "s/--sidebar-primary: oklch(0.45 0.16 270);/--sidebar-primary: oklch(${BRAND_COLOR});/" src/app/globals.css
  sed -i "s/--sidebar-accent: oklch(0.45 0.16 270);/--sidebar-accent: oklch(${BRAND_COLOR});/" src/app/globals.css
  sed -i "s/--sidebar-ring: oklch(0.45 0.16 270);/--sidebar-ring: oklch(${BRAND_COLOR});/" src/app/globals.css
fi
echo "  ✓ Brand colors → oklch(${BRAND_COLOR})"

# ── Step 4: Environment files ─────────────────────────────

if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "  ✓ Created .env.local (fill in your Supabase values)"
else
  echo "  ✓ .env.local already exists — skipping"
fi

if [ ! -f prisma/.env ]; then
  cp .env.example prisma/.env
  echo "  ✓ Created prisma/.env (fill in your Supabase values)"
else
  echo "  ✓ prisma/.env already exists — skipping"
fi

# ── Step 5: Install dependencies ──────────────────────────

echo ""
echo -e "${CYAN}Installing dependencies...${RESET}"
npm install
echo "  ✓ Dependencies installed"

# ── Step 6: Generate Prisma client ────────────────────────

echo ""
echo -e "${CYAN}Generating Prisma client...${RESET}"
npx prisma generate
echo "  ✓ Prisma client generated"

# ── Step 7: Git init (optional) ───────────────────────────

echo ""
read -p "$(echo -e ${YELLOW}Initialize git repository? ${RESET}[y/N]: )" INIT_GIT
if [[ "$INIT_GIT" =~ ^[Yy]$ ]]; then
  git init
  git add -A
  git commit -m "init: ${PROJECT_SLUG} from dk-launchpad template"
  echo "  ✓ Git repository initialized"
fi

# ── Done ──────────────────────────────────────────────────

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${RESET}"
echo -e "${GREEN}║   Setup complete! Next steps:            ║${RESET}"
echo -e "${GREEN}║                                          ║${RESET}"
echo -e "${GREEN}║  1. Fill in .env.local with Supabase     ║${RESET}"
echo -e "${GREEN}║     credentials                          ║${RESET}"
echo -e "${GREEN}║  2. Run: npx prisma migrate dev          ║${RESET}"
echo -e "${GREEN}║  3. Run: npx prisma db seed              ║${RESET}"
echo -e "${GREEN}║  4. Run: npm run dev                     ║${RESET}"
echo -e "${GREEN}║  5. Open: http://localhost:3000           ║${RESET}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${RESET}"
echo ""

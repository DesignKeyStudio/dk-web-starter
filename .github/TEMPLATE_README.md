# Using This Template

This is a GitHub Template repository. Click **"Use this template"** → **"Create a new repository"** to get started.

## After creating your repo

```bash
git clone https://github.com/YOUR_ORG/YOUR_REPO.git
cd YOUR_REPO
bash setup.sh
```

The setup script will:
- Ask for your project name and brand color
- Rename the package and update all placeholders
- Create `.env.local` from `.env.example`
- Run `npm install` and `npx prisma generate`
- Optionally initialize git

## What's included

- **Next.js 16** + React 19 + TypeScript 5
- **Prisma 6** + PostgreSQL (Supabase)
- **Supabase Auth** (login, register, forgot/reset password)
- **4-role RBAC** (Admin, Manager, Contributor, Viewer)
- **Multi-org scoping** via `getAuthContext()`
- **Settings pages** (Account, Organization, Users, Roles, Departments, Activity Log + skeleton Billing & Integrations)
- **shadcn/ui** + **ReUI** component library
- **Zustand** auth store + **TanStack React Query** data layer
- **Storybook 10** + Vitest integration tests
- **OKLCh design token system** (light + dark mode)

## Stack

Next.js 16 | React 19 | TypeScript 5 | Tailwind CSS v4 | shadcn/ui + ReUI | Prisma 6 | Supabase Auth | PostgreSQL | Zustand 5 | TanStack React Query 5 | TanStack React Table 8 | React Hook Form 7 + Zod 3 | Storybook 10

See [README.md](../README.md) for full documentation.

---
name: fullstack-setup
description: Set up a Next.js frontend with Express.js backend project structure. Includes common patterns for auth, sidebar navigation, database, and API routes.
---

# Full-Stack Project Setup

Set up a Next.js frontend with Express.js backend, following the patterns established in this codebase.

## Project Structure

```
project/
├── frontend/                    # Next.js App Router
│   ├── app/                     # Pages and routes
│   │   ├── layout.tsx           # Root layout with providers
│   │   ├── page.tsx             # Landing/home page
│   │   ├── login/               # Auth pages
│   │   ├── signup/
│   │   └── dashboard/           # Protected routes
│   │       ├── layout.tsx       # Dashboard layout with sidebar
│   │       └── page.tsx
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── app-sidebar.tsx      # Main sidebar
│   │   └── nav-*.tsx            # Navigation components
│   ├── lib/
│   │   ├── supabase/            # Auth client/server/middleware
│   │   │   ├── server.ts
│   │   │   ├── client.ts
│   │   │   └── middleware.ts
│   │   └── utils.ts
│   ├── middleware.ts             # Route protection
│   ├── package.json
│   └── components.json          # shadcn config
├── backend/                     # Express.js
│   ├── src/
│   │   ├── index.ts             # Server entry
│   │   ├── routes/              # API routes
│   │   ├── middleware/           # Auth, RBAC
│   │   └── lib/
│   │       └── db/              # Database models
│   ├── package.json
│   └── tsconfig.json
└── .env.local                   # Environment variables
```

## Setup Steps

### 1. Initialize Frontend (Next.js)

```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir
cd frontend
npx shadcn@latest init
```

### 2. Add Common shadcn Components

```bash
npx shadcn@latest add button card dialog input label sidebar separator skeleton avatar dropdown-menu breadcrumb sheet tooltip scroll-area collapsible field
```

### 3. Initialize Backend (Express.js)

```bash
mkdir backend && cd backend
npm init -y
npm install express cors dotenv
npm install -D typescript @types/express @types/cors tsx
npx tsc --init
```

### 4. Common Patterns to Implement

**Auth (Supabase pattern):**
- `lib/supabase/server.ts` — Server-side client
- `lib/supabase/client.ts` — Browser client
- `lib/supabase/middleware.ts` — Middleware client
- `middleware.ts` — Route protection

**Sidebar Navigation:**
- Use shadcn Sidebar component
- Nav sections: main items, projects, user menu
- Role-based visibility

**Protected Routes:**
- Middleware checks auth status
- Unauthenticated → redirect to `/login`
- Authenticated on login page → redirect to `/chat` or `/dashboard`

**Database:**
- Supabase for serverless (auth + Postgres)
- MongoDB for Express.js backend projects
- Direct DB queries in server components (avoids "Failed to fetch")

## Key Conventions

- Use `"use client"` only when needed (interactivity, hooks)
- Server components are default in Next.js App Router
- `useSearchParams()` requires `<Suspense>` boundary in Next.js 16
- Route segments: `app/(protected)/dashboard/page.tsx`
- API routes: `app/api/*/route.ts`

## When to Use

- User requests "create a Next.js frontend and Express.js backend"
- User requests "set up full-stack project with login and sidebar"
- Starting a new project with the established tech stack

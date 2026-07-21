---
name: build-verification
description: Run TypeScript type-check and Next.js build to verify code changes compile without errors. Use after any code modification to catch type errors and build failures before they reach production.
---

# Build Verification

After making code changes, run this verification sequence to catch errors early.

## Steps

### 1. TypeScript Type-Check (frontend)

```bash
cd <frontend-dir> && npx tsc --noEmit 2>&1 | head -30
```

- If errors found, fix them before proceeding.
- Use `--pretty` flag for better readability when needed.

### 2. TypeScript Type-Check (backend, if applicable)

```bash
cd <backend-dir> && npx tsc --noEmit 2>&1 | head -30
```

### 3. Next.js Build (frontend)

```bash
cd <frontend-dir> && npx next build 2>&1 | tail -30
```

- For a clean rebuild (after dependency changes or stale cache):
  ```bash
  cd <frontend-dir> && rm -rf .next && npx next build 2>&1 | tail -30
  ```

### 4. Backend Build (if applicable)

```bash
cd <backend-dir> && npm run build 2>&1 | tail -10
```

## Common Project Paths

- `/root/myai` — Next.js 16 + Supabase AI companion app
- `/root/myworkspace/frontend` — Next.js frontend (workspace project)
- `/root/myworkspace/backend` — Express.js backend (workspace project)
- `/root/app-bni/frontend` — Next.js frontend (BNI project)

## Error Interpretation

- **Type errors** (`TS2xxx`): Fix type mismatches, missing imports, incorrect generics
- **Module not found**: Check import paths, run `npm install` if needed
- **Build errors in page components**: Usually missing exports, wrong API usage, or Suspense boundary issues (Next.js 16 requires `<Suspense>` for `useSearchParams()`)
- **ESLint errors**: Non-blocking for build but should be addressed. Warnings are acceptable.

## When to Use

- After any file edit or code modification
- Before committing changes
- When debugging "page couldn't load" or runtime errors
- After adding new dependencies
- When user reports build failures

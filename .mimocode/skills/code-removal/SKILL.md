---
name: code-removal
description: Systematically remove a feature, route, file, or component from a codebase. Finds all references, removes imports, route definitions, UI elements, tests, and database references.
---

# Code Removal

When removing a feature, route, file, or component, follow this systematic process to avoid leaving orphaned code or broken references.

## Steps

### 1. Identify the Target

Determine what is being removed:
- A route (e.g., `/team-time`, `/orgmenu/analytics`)
- A file or module (e.g., `migrate.ts`, hermes agent code)
- A UI component or feature (e.g., "rounded corners", promotional text)
- A dependency or integration (e.g., Supabase, WhatsApp)

### 2. Find All References

Search the codebase for all references to the target:

```bash
# Search by name/keyword across all source files
grep -r "<target-name>" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" <project-dir>

# Search for imports
grep -r "import.*<target>" --include="*.ts" --include="*.tsx" <project-dir>

# Search for route definitions
grep -r "<route-path>" --include="*.ts" --include="*.tsx" <project-dir>

# Search for component usage
grep -r "<ComponentName>" --include="*.tsx" --include="*.jsx" <project-dir>
```

### 3. Remove in Order

Remove references in this order to minimize breakage:

1. **UI components and pages** — Remove page files, component files
2. **Route definitions** — Remove from router/sidebar/nav configs
3. **API routes** — Remove endpoint files and route registrations
4. **Imports** — Remove all import statements referencing the target
5. **Type definitions** — Remove related types and interfaces
6. **Database references** — Remove schema, migrations, model files
7. **Tests** — Remove or update test files
8. **Configuration** — Remove from config files, env vars, package.json

### 4. Verify Removal

After removal, run build verification:

```bash
cd <frontend-dir> && npx tsc --noEmit 2>&1 | head -20
cd <frontend-dir> && npx next build 2>&1 | tail -20
```

### 5. Clean Up

- Remove empty directories left behind
- Update any documentation or comments referencing the removed code
- Check for unused dependencies that can be removed from `package.json`

## Common Removal Patterns

### Remove a Route/Page
1. Delete the page file (e.g., `app/team-time/page.tsx`)
2. Remove from sidebar navigation config
3. Remove from any route guards or middleware
4. Remove related API routes if they exist
5. Remove any shared components only used by that route

### Remove a Feature/Module
1. Find all files in the module directory
2. Search for imports of module exports
3. Remove module files
4. Remove all import statements
5. Remove from any barrel exports (index.ts)
6. Remove related types
7. Remove tests

### Remove a Dependency
1. `npm uninstall <package>`
2. Search for all imports of the package
3. Remove or replace import statements
4. Remove any config referencing the package
5. Rebuild to verify

## When to Use

- User requests "remove X from codebase"
- User requests "delete the Y route"
- Cleaning up deprecated features
- Removing unused code after refactoring

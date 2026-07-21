---
description: Stage all changes, commit with a descriptive message, and push to GitHub remote.
---

# Git Push

Standard workflow to commit and push changes to GitHub.

## Steps

### 1. Check Current Status

```bash
git status
git diff --stat
git log --oneline -5
```

### 2. Stage Changes

```bash
git add -A
```

Or stage specific files:
```bash
git add <file1> <file2>
```

### 3. Commit

```bash
git commit -m "<descriptive message>"
```

Commit message conventions:
- Use imperative mood ("add feature" not "added feature")
- Keep first line under 72 characters
- Reference issue numbers when applicable: `fix: resolve login error (#123)`

Common prefixes:
- `feat:` — new feature
- `fix:` — bug fix
- `refactor:` — code restructuring
- `chore:` — maintenance tasks
- `docs:` — documentation changes

### 4. Push

```bash
git push origin main
```

For new branches:
```bash
git push -u origin <branch-name>
```

### 5. Verify

```bash
git status
```

Confirm "nothing to commit, working tree clean" and branch is up to date with remote.

## When to Use

- After completing a feature or fix
- User requests "push the code to GitHub"
- Before starting new work to save current progress

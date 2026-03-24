---
name: pr-description
description: Write PR descriptions and release notes for the Sanity monorepo. Follows the repo's PR template with Description, What to review, Testing, and Notes for release sections. Auto-triggers when creating PRs via `gh pr create`. Use when creating pull requests, writing PR descriptions, drafting release notes, or when user mentions PR, pull request, or release notes.
---

# PR Description & Release Notes

## When creating a PR

Follow the repo's PR template. Always create PRs as **drafts**.

### 1. Analyze the changes

Before writing, understand the full diff:

```bash
git log main..HEAD --oneline
git diff main...HEAD
```

### 2. PR title

Must follow conventional commits (CI-enforced):

```
type(scope): lowercase description
```

- **Types**: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `ci`
- **Scope**: package or area affected (`groq`, `cli`, `form`, `schema`, `deps`, etc.)
- **No backticks, quotes, or markdown** in the title
- Description starts lowercase

### 3. Write the PR body

**Be terse.** Don't describe things the reviewer can trivially see from the diff (e.g. "renamed variable X to Y", "added import for Z"). Focus on context and intent that _isn't_ obvious from the code.

Use all four sections:

#### Description

- **What** changed — be concrete and specific
- **Why** — motivation, context, linked issue if any
- Use bullet points for multiple changes

#### What to review

- Which files/areas matter most
- Anything tricky or non-obvious
- Which packages are affected (this is a monorepo)

#### Testing

- Tests added or modified
- If no automated tests: how you tested and why automation wasn't practical

#### Notes for release

This section is used by the docs team to write release notes.

**If not needed**, write one of:

- `N/A` — internal-only changes
- `N/A – Part of feature X` — partial implementation not yet enabled
- `N/A – Internal only` — tooling/chore work

**If needed**, write for end users and the docs team:

- What changed from a user perspective
- How to use it (code snippets if applicable)
- Limitations or breaking changes

### 4. Create the PR

**Always create as draft.** Do not mark as ready for review until CI passes.

```bash
gh pr create --draft --title "type(scope): description" --body "$(cat <<'EOF'
### Description

[what and why]

### What to review

[guidance for reviewers]

### Testing

[tests added or manual testing explanation]

### Notes for release

[release notes or N/A]
EOF
)"
```

After CI is green, mark ready for review:

```bash
gh pr ready
```

## Release notes checklist

- [ ] Written for end users, not internal engineers
- [ ] Includes code snippets for new APIs or changed behavior
- [ ] Mentions breaking changes prominently
- [ ] No unexplained jargon
- [ ] Concise — a paragraph plus code example is ideal

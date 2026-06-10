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

**Lead with why. Only elaborate on the non-obvious.** The reviewer can read the diff — they need the context the diff can't give them. Default to terse; expand only where a reader would genuinely wonder.

Priorities for the Description section:

- **Heavy on _why_** — the motivation, the problem being solved, the constraint or incident that forced this change
- **Cover _why not_** — alternatives considered and rejected, one sentence each. This is often the most valuable part: it prevents the reviewer from suggesting a path you've already ruled out. Skip if there were no real alternatives worth mentioning
- **Light on _how_** — only call out approach when it's non-obvious, novel, or a reviewer might reasonably have picked a different path. Skip it for routine changes where the diff speaks for itself
- **Minimal _what_** — the diff shows what changed. One sentence of orientation at most; don't restate file-by-file changes the reviewer can see

**Length test:** if a sentence would tell the reviewer something they could deduce in 10 seconds from the diff, cut it. A good PR description is often 3–5 sentences total. Bulleted lists of "alternatives considered" should be one line per alternative, not a paragraph.

If you catch yourself writing "this PR renames X to Y" or "adds a new function Z", delete it. If you're explaining _why_ X needed to be renamed or _why_ Z exists (and why the obvious alternative wasn't chosen), keep it — but stay brief.

Use all four sections:

#### Description

Focus on **why** and **why not**, tersely:

- The problem or context the diff doesn't reveal (one short paragraph)
- Alternatives considered and why rejected (one line each, only if they were real candidates)
- _How_ only when non-obvious or debatable
- _What_ reduced to a one-line orientation

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

---
name: code-review-and-quality
description: "Reviews code changes across five axes: correctness, readability, architecture, security, and performance. Checks for bugs, N+1 queries, injection vulnerabilities, dead code, and missing tests. Use when reviewing a PR, pull request, diff, or code change before merging. Use when evaluating code written by yourself, another agent, or a human. Use when you need a structured code review with severity-labeled findings."
---

# Code Review and Quality

Multi-dimensional code review with quality gates. Every change gets reviewed before merge — no exceptions. Review covers five axes: correctness, readability, architecture, security, and performance.

**Approval standard:** Approve when a change definitely improves overall code health, even if it isn't perfect. Don't block because it isn't how you would have written it.

## Review Process

### Step 1: Understand the Context

Before looking at code, understand the intent:

- What is this change trying to accomplish?
- What spec or task does it implement?
- What is the expected behavior change?

### Step 2: Review the Tests First

Tests reveal intent and coverage:

- Do tests exist for the change?
- Do they test behavior (not implementation details)?
- Are edge cases covered?
- Do tests have descriptive names?
- Would the tests catch a regression if the code changed?

### Step 3: Review the Implementation

Walk through the code with the five axes in mind:

#### Correctness

- Does it match the spec or task requirements?
- Are edge cases handled (null, empty, boundary values)?
- Are error paths handled (not just the happy path)?
- Are there off-by-one errors, race conditions, or state inconsistencies?

#### Readability & Simplicity

- Are names descriptive and consistent with project conventions?
- Is the control flow straightforward (no nested ternaries, deep callbacks)?
- Could this be done in fewer lines without sacrificing clarity?
- Are abstractions earning their complexity? (Don't generalize until the third use case)
- Are there dead code artifacts: no-op variables, backwards-compat shims, or `// removed` comments?

#### Architecture

- Does it follow existing patterns or introduce a new one? If new, is it justified?
- Does it maintain clean module boundaries?
- Is there code duplication that should be shared?
- Are dependencies flowing in the right direction (no circular deps)?

#### Security

For detailed guidance, see `security-and-hardening`.

- Is user input validated and sanitized?
- Are secrets kept out of code, logs, and version control?
- Is authentication/authorization checked where needed?
- Are SQL queries parameterized (no string concatenation)?
- Are outputs encoded to prevent XSS?
- Is data from external sources (APIs, user content, config files) treated as untrusted?

#### Performance

For detailed guidance, see `performance-optimization`.

- Any N+1 query patterns?
- Any unbounded loops or unconstrained data fetching?
- Any synchronous operations that should be async?
- Any unnecessary re-renders in UI components?
- Any missing pagination on list endpoints?

### Step 4: Categorize Findings

Label every comment with severity:

| Prefix                        | Meaning            | Author Action                                           |
| ----------------------------- | ------------------ | ------------------------------------------------------- |
| _(no prefix)_                 | Required change    | Must address before merge                               |
| **Critical:**                 | Blocks merge       | Security vulnerability, data loss, broken functionality |
| **Nit:**                      | Minor, optional    | Author may ignore — formatting, style preferences       |
| **Optional:** / **Consider:** | Suggestion         | Worth considering but not required                      |
| **FYI**                       | Informational only | No action needed — context for future reference         |

### Step 5: Verify the Verification

- What tests were run? Did the build pass?
- Was the change tested manually?
- Are there screenshots for UI changes?

## Example Review Output

```
## Review: fix(form): handle null values in array input

### Findings

**Critical:** `src/core/form/inputs/ArrayInput.tsx:42`
The null check only covers the top-level value — nested array items
can still be null when a document is partially migrated.
Before: `if (!value) return`
Fix: `if (!value?.length) return` and guard individual items in the map.

**Nit:** `src/core/form/inputs/ArrayInput.tsx:58`
`data` → `arrayItems` for clarity.

**Optional:** `src/core/form/inputs/ArrayInput.test.tsx:15`
Consider adding a test case for sparse arrays with null holes —
this is the scenario that caused the original bug.

### Verdict: Request changes
One Critical issue (null nested items) must be fixed before merge.
```

## Dead Code Hygiene

After any refactoring, check for orphaned code. List it explicitly and ask before deleting:

```
DEAD CODE IDENTIFIED:
- formatLegacyDate() in src/utils/date.ts — replaced by formatDate()
- OldTaskCard component in src/components/ — replaced by TaskCard
→ Safe to remove these?
```

## Dependency Review

Before adding any dependency:

1. Does the existing stack solve this? (Often it does.)
2. How large is it? (Check bundle impact.)
3. Is it actively maintained? (Last commit, open issues.)
4. Known vulnerabilities? (`npm audit`)
5. License compatible with the project?

Prefer standard library and existing utilities over new dependencies.

## Change Sizing

Target small, focused changes:

- ~100 lines → Good. Reviewable in one sitting.
- ~300 lines → Acceptable for a single logical change.
- ~1000 lines → Too large. Split it.

Separate refactoring from feature work — submit them as separate changes.

## Review Checklist

```markdown
## Review: [PR/Change title]

### Context
- [ ] I understand what this change does and why

### Correctness
- [ ] Change matches spec/task requirements
- [ ] Edge cases handled
- [ ] Error paths handled
- [ ] Tests cover the change adequately

### Readability
- [ ] Names are clear and consistent
- [ ] Logic is straightforward
- [ ] No unnecessary complexity

### Architecture
- [ ] Follows existing patterns
- [ ] No unnecessary coupling or dependencies
- [ ] Appropriate abstraction level

### Security
- [ ] No secrets in code
- [ ] Input validated at boundaries
- [ ] No injection vulnerabilities
- [ ] External data sources treated as untrusted

### Performance
- [ ] No N+1 patterns
- [ ] No unbounded operations
- [ ] Pagination on list endpoints

### Verification
- [ ] Tests pass
- [ ] Build succeeds
- [ ] Manual verification done (if applicable)

### Verdict
- [ ] **Approve** — Ready to merge
- [ ] **Request changes** — Issues must be addressed
```

## See Also

- For detailed security review guidance, see `references/security-checklist.md`
- For performance review checks, see `references/performance-checklist.md`

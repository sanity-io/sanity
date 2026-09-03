---
name: sanity-ui-migration-progress
description: Measures @sanity/ui v5 side-by-side migration progress — per-component import file counts (v5 alias vs @sanity/ui), JSX instance counts, and styled() instance counts with alias resolution. Use when reporting migration status or tracking progress over time.
---

# Sanity UI migration progress

Reports how far an `@sanity/ui` → v5 migration has progressed in a directory tree.

## Migration model

This skill assumes a **side-by-side** setup:

- **`@sanity/ui`** — legacy package still on v3 or v4
- **v5 alias** (usually `ui5`) — v5 installed under a package alias, e.g. `"ui5": "npm:@sanity/ui@alpha"` in `package.json`
- Migrated components import from the alias; unmigrated ones still import from `@sanity/ui`

Both can coexist during a gradual, per-component migration.

## When to use

- User asks for migration progress, status, or coverage
- After a migration batch — compare to a saved baseline
- CI or periodic snapshots (run the script, commit or archive output)

## Quick start

Run the script from the repo root (paths below are relative to it).

**All components in progress** (any component with a v5 import):

```bash
bash .agents/skills/sanity-ui-migration-progress/scripts/measure-progress.sh <dir> [v5-alias] [@sanity/ui]
```

**Specific component(s)** (including before migration has started):

```bash
bash .agents/skills/sanity-ui-migration-progress/scripts/measure-progress.sh <dir> --component Flex
bash .agents/skills/sanity-ui-migration-progress/scripts/measure-progress.sh <dir> --component Box --component Flex
```

| Argument           | Default      | Example                                |
| ------------------ | ------------ | -------------------------------------- |
| `<dir>`            | _(required)_ | `.`, `src/`, `apps/studio`             |
| `[v5-alias]`       | `ui5`        | Side-by-side alias from `package.json` |
| `[@sanity/ui]`     | `@sanity/ui` | Legacy import path still on v3/v4      |
| `--component NAME` | _(none)_     | `Flex`, `Box` — repeat for several     |

**Detect alias** when unsure:

```bash
rg '"([^"]+)":\s*"npm:@sanity/ui@' package.json -r '$1'
```

If the default `ui5` finds no imports, the script auto-detects the alias from the nearest `package.json`.

**Scope matters.** Counts depend on the directory passed — scanning a subdirectory vs repo root (`.`) can differ when ui5 imports exist in multiple packages or apps. Always state the directory used in the report.

### Choosing scope

Infer the directory from what the user says — do not default to a subdirectory unless they name one.

| User says                                                        | Directory                                                                  |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------- |
| "across the repo", "whole repo", "entire monorepo", "everywhere" | `.` (repo root)                                                            |
| A specific path ("in `src/`", "the studio app")                  | That path                                                                  |
| Nothing about scope                                              | Ask — or use `.` in monorepos where ui5 imports may span multiple packages |

In monorepos, ui5 imports often live in several packages or apps — scanning only the main library undercounts repo-wide progress.

## Workflow

```
- [ ] 1. Confirm directory, v5 alias, and optional component name(s)
- [ ] 2. Run measure-progress.sh
- [ ] 3. Present the table + call out partial components
```

### Step 1 — Confirm scope

Ask or infer (see [Choosing scope](#choosing-scope) above):

| Input         | Notes                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Directory** | Repo-wide requests → `.`; subdirectory requests → that path                                                                          |
| **v5 alias**  | Usually `ui5`; monorepos may resolve via `catalog:` — import path in source is still `ui5`                                           |
| **Component** | Optional. Omit to list all components with v5 imports; provide one name to measure that component only (works even if not on v5 yet) |

### Step 2 — Run the script

**All in-progress components (repo-wide):**

```bash
bash .agents/skills/sanity-ui-migration-progress/scripts/measure-progress.sh . ui5
```

**Scoped to a subdirectory:**

```bash
bash .agents/skills/sanity-ui-migration-progress/scripts/measure-progress.sh src/ ui5
```

**One component:**

```bash
bash .agents/skills/sanity-ui-migration-progress/scripts/measure-progress.sh <dir> ui5 --component Flex
```

If the user names a component, always pass `--component` — do not rely on discover mode.

If discover mode finds **no v5 imports**, report that and stop — do not attempt to install anything:

- **No alias in `package.json`** — the repo has no v5 side-by-side setup; nothing to measure
- **Alias present, no imports** — setup exists but migration has not started (or the directory is too narrow). Suggest `--component <Name>` to measure legacy usage for a specific component.

Example output columns:

| Column                  | Meaning                                                       |
| ----------------------- | ------------------------------------------------------------- |
| **v5 imp**              | Files with a value import of this component from the v5 alias |
| **leg imp**             | Files still importing from `@sanity/ui`                       |
| **imp tot**             | Union of import files (both packages in one file counts once) |
| **jsx mig / unm / tot** | `<LocalName>` instances via alias-resolved bindings           |
| **jsx %**               | `jsx mig / jsx tot`                                           |
| **sty mig / unm / tot** | `styled(LocalName)` at definition sites                       |

The **component list** comes from v5 imports (discover mode) or from `--component` flags. Discover mode omits components not yet on v5; `--component` always reports the named component(s).

### Step 3 — Present results

Summarize in plain language:

1. **Fully migrated** — `leg imp = 0` and `jsx unm = 0`
2. **In progress** — v5 imports exist but legacy imports or JSX remain

Discover mode only lists components with at least one v5 import — everything in the table
has migration started. Components still entirely on `@sanity/ui` do not appear unless the
user passed `--component`.

Use this template:

```markdown
## Migration progress: `<dir>`

**Scope:** `<dir>` · v5 alias `ui5` · `<date>`

| Component | v5 files | legacy files | JSX migrated | JSX remaining | JSX % |
| --------- | -------- | ------------ | ------------ | ------------- | ----- |
| …         | …        | …            | …            | …             | …     |

**Fully migrated:** …
**In progress:** …
```

## Limitations

| Gap                            | Why                                                                                           |
| ------------------------------ | --------------------------------------------------------------------------------------------- |
| **Element-type indirection**   | `cond ? Box : Card` — not counted; needs manual migration                                     |
| **Cross-file styled wrappers** | Counts `styled(LocalName)` where defined; usage in importers is not re-attributed             |
| **Re-exports / barrels**       | Binding must appear in the file that uses the component                                       |
| **Mixed imports in one file**  | JSX split by binding source; rare double-import files may need manual review                  |
| **Components not on ui5 yet**  | Absent from discover-mode table; use `--component` to measure legacy usage for a specific one |

This skill **reports only** — it does not install dependencies or run migrations. If v5 is not
present, say so and stop.

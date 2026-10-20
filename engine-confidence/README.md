# Engine confidence

Produces the weekly Engine Confidence Score for the document sync engine (`@sanity/mutator` and the document store and form patch code in `packages/sanity`). The result is one `engineConfidenceRun` document per ISO week, shown in the Radar "Engine confidence" tab.

The score is Stryker's mutation score, stored as `score.ratio`: (killed + timeout) / (killed + timeout + survived + no coverage). Stryker mutates the tier 1 engine files (`tier1.json`) and runs the unit tests; the score is the share of planted bugs a test fails on. Reporting that reads the dataset directly (BigQuery, Omni) should read `score.ratio`: one field, no blending.

The catalogue (`knownBugs`) is replayed alongside it and stored for its own sake: each entry is a patch that reintroduces a past or plausible bug, and Radar shows how many of the active entries at least one suite catches. It is supporting detail only and never feeds `score`. The e2e suite is recorded as `not-run` in every catalogue entry.

Stryker ignores the message of `new SomeError(...)` / `SomeError(...)` calls and every `console.*(...)` and `debug(...)` call (`stryker/messageIgnorer.ts`), so message text and log lines do not count as generated bugs. Only the message is ignored: the `throw` statement, the condition and block around it and strings such as action names stay scored, because deleting a throw lets bad input through silently. Ignored mutants show up as `counts.ignored` and stay out of the ratio.

The score cannot reach 100%: some mutants are equivalent to the original code. The reviewed ones are listed in `exclusions.json` (see below) and show up as `counts.excluded`. A `config.version` change breaks the series, and Radar draws a marker at that week.

## Commands

Run from the repo root as `pnpm engine-confidence <command>`. Every command writes under `engine-confidence/reports/` (gitignored). Paths passed to a command resolve from the `engine-confidence/` directory, so the report is `reports/engine-confidence-run.json`.

| Command                                                                                                                        | What it does                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `stryker --target <sanity\|mutator> [--full] [--previous-dir <dir>]`                                                           | Runs Stryker for one target. Reuses the previous incremental result when the pinned config matches, otherwise runs in full. |
| `catalogue [--suites <ids>] [--only <ids>] [--check-only]`                                                                     | Applies each catalogue patch, runs the suites, reverts. `--check-only` only checks the patches apply.                       |
| `score [--stryker-dir <dir>] [--catalogue <file>] [--started-at <iso>] [--trigger <schedule\|dispatch\|local>] [--out <file>]` | Builds the run document from the Stryker reports and the catalogue results.                                                 |
| `store <file> [--dry-run]`                                                                                                     | Writes the document to Radar. `--dry-run` prints the id and the document and needs no token.                                |
| `pin`                                                                                                                          | Recomputes the config hash and bumps `config.version` when it changed.                                                      |
| `unit`                                                                                                                         | Runs this package's unit tests.                                                                                             |

Exit codes: `score` returns 8 when the exclusion register has a problem. `stryker` returns 3 for a dirty package, 5 when a guard fails (a surviving mutant that ran no test, or fewer dry run tests than `dryRunFloor`) and 6 for a config hash mismatch. `catalogue` returns 2 for a patch that does not apply, 3 for a dirty tree, 4 for a suite that is red on the clean tree, 6 for a hash mismatch and 7 for a witness that passes with its patch applied.

## Run it locally

Use a disposable checkout. Stryker runs in place: it rewrites every tier 1 source file, adds `// @ts-nocheck` and restores them when it finishes. A killed run leaves the sources mutated, and the next run refuses to start on a dirty package. Recover with:

```bash
git checkout -- packages/sanity/src packages/@sanity/mutator/src
```

Run the targets and the catalogue one after the other, never together. `packages/sanity` tests import `@sanity/mutator` sources, so a mutator run leaks mutants into a `sanity` run.

```bash
pnpm install
pnpm build
pnpm engine-confidence stryker --target mutator --full
pnpm engine-confidence stryker --target sanity --full
pnpm engine-confidence catalogue
pnpm engine-confidence score
pnpm engine-confidence store reports/engine-confidence-run.json --dry-run
```

For a quicker pass, `catalogue --suites unit:mutator,unit:engine` skips the fuzz suite and records it as `not-run`. The known bugs count of such a run is not comparable with a full one.

## The exclusion register

`exclusions.json` lists mutants a reviewer judged meaningless to test: no input the code accepts gives a different observable result, so no test could ever catch them. `score` matches each entry to a Stryker mutant by file, mutator, replacement and original snippet, plus a `contextHash` of the surrounding lines when the same mutation repeats in a file, and reports it as `counts.excluded`, outside the ratio and apart from `counts.ignored`. Unreachable code and mutants that are only equivalent under an assumption about the input do not qualify: those get a test or get deleted. `score` fails with exit code 8 and lists the entries when one matches no mutant (the code changed, so it needs a new review), is ambiguous, duplicates the ignore rules, or matches a mutant a test detected (it was catchable, so remove it).

## The pinned config

`config.json`, `tier1.json`, `exclusions.json`, everything in `stryker/`, the Stryker patch in `patches/` and the two `@stryker-mutator/*` versions define the measurement. Their sha256 is `pinnedHash` in `config.json`. Run `pnpm engine-confidence pin` after changing any of them: it writes the new hash and increments `version`. A unit test fails when the hash is stale, so the pull request catches an unpinned change.

The catalogue and the installed Vitest version are left out of the hash, so adding an entry or bumping Vitest does not break the series.

## The Stryker runner patch

`@stryker-mutator/vitest-runner@10.0.0` joins suite and test names with a space and Vitest 5 matches names joined with `>`. Without the patch every test inside a `describe` is filtered out and the mutant is reported as survived. `patches/@stryker-mutator__vitest-runner@10.0.0.patch` fixes the join. The zero-test survivor guard in `stryker` fails the run if the patch is lost.

## The catalogue

Each entry is `catalogue/ENG-00N-<slug>.patch` plus a `.json` sidecar (`CatalogueEntryMetadata` in `@repo/utils/engine-confidence`). `notApplicableSuites` lists suites that never execute the patched code, and the runner skips them. `expectedCaughtBy` is what the author expects. The runner logs a surprise and does not fail on it.

Every patch must only touch files the pull request check watches (`.github/workflows/engine-confidence-catalogue.yml`), and a unit test asserts it.

### Adding an entry

1. Make the smallest change that reintroduces the bug and save it as a patch: `git diff -- <file> > engine-confidence/catalogue/ENG-00N-<slug>.patch`.
2. Add the sidecar with the same name. Take the next free id and never reuse one, even after an entry is retired.
3. Add a witness when you can. A witness is a test that fails with the patch and passes without it. Add the test file at its real location, run `git add -N <file>`, then `git diff -- <file> > engine-confidence/catalogue/witness/ENG-00N.witness.patch`, then `git rm --cached <file>` and delete it. The runner applies the bug and the witness together and exits 7 when the witness passes, because that means the patch is inert.
4. Run `pnpm engine-confidence catalogue --only ENG-00N`.

Retire an entry with `retiredOn` and `retiredReason` in its sidecar when the code it targets is removed. Do not delete it.

### Refreshing a stale patch

`catalogue --check-only` and the pull request check fail when a patch no longer applies. Apply the change by hand to the current code, regenerate the patch with `git diff`, and run the entry again. Check the witness still fails with the new patch.

### Rejected candidate

Another candidate, `pair-teardown-drops-uncommitted-edits`, removed the 5 s grace period before a document pair is torn down. It is probably inert: `editState` has its own 1 s grace that keeps the pair alive past the autocommit. No harness caught it and no witness could be written, so it is not in the catalogue.

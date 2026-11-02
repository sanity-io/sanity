# Engine confidence

Produces the weekly engine confidence scores for the document sync engine (`@sanity/mutator` and the document store and form patch code in `packages/sanity`). The result is one `engineConfidenceRun` document per ISO week, shown in the Radar "Engine confidence" tab.

Each run stores two scores, and both are Stryker's mutation score: (killed + timeout) / (killed + timeout + survived + no coverage). Stryker mutates the tier 1 engine files (`tier1.json`) and runs the unit tests, so a score is the share of planted bugs a test fails on.

| Field               | Score                    | Covers                                                                                |
| ------------------- | ------------------------ | ------------------------------------------------------------------------------------- |
| `score.ratio`       | Total engine score       | Both targets: the `sanity` files and `@sanity/mutator`                                |
| `studioScore.ratio` | Core Studio engine score | The `sanity` target only: the document store and form patch code in `packages/sanity` |

Both come from the same run. Every file in `score.files` carries its target, and `studioScore` sums the `sanity` files. Reporting that reads the dataset directly (BigQuery, Omni) should read these two fields. Documents with `schemaVersion` 1 have no `studioScore`.

The catalogue (`knownBugs`) is replayed alongside it and stored for its own sake: each entry is a patch that reintroduces a past or plausible bug, and Radar shows how many of the active entries at least one suite catches. It is supporting detail only and never feeds `score` or `studioScore`. The e2e suite is recorded as `not-run` in every catalogue entry.

Stryker ignores the message of `new SomeError(...)` / `SomeError(...)` calls and every `console.*(...)` and `debug(...)` call (`stryker/messageIgnorer.ts`), so message text and log lines do not count as generated bugs. Only the message is ignored: the `throw` statement, the condition and block around it and strings such as action names stay scored, because deleting a throw lets bad input through silently. Ignored mutants show up as `counts.ignored` and stay out of the ratio.

The score cannot reach 100%: some mutants are equivalent to the original code. The reviewed ones are listed in `exclusions.json` (see below) and show up as `counts.excluded`. A `config.version` change breaks the series, and Radar draws a marker at that week.

## Commands

Run from the repo root as `pnpm engine-confidence <command>`. Every command writes under `engine-confidence/reports/` (gitignored). Paths passed to a command resolve from the `engine-confidence/` directory, so the report is `reports/engine-confidence-run.json`.

| Command                                                                                                                                                      | What it does                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `stryker --target <sanity\|mutator> [--full] [--previous-dir <dir>]`                                                                                         | Runs Stryker for one target. Reuses the previous incremental result when the pinned config matches, otherwise runs in full. |
| `catalogue [--suites <ids>] [--only <ids>] [--check-only]`                                                                                                   | Applies each catalogue patch, runs the suites, reverts. `--check-only` only checks the patches apply.                       |
| `score [--stryker-dir <dir>] [--catalogue <file>] [--started-at <iso>] [--trigger <schedule\|dispatch\|local>] [--out <file>]`                               | Builds the run document from the Stryker reports and the catalogue results.                                                 |
| `store <file> [--dry-run]`                                                                                                                                   | Writes the document to Radar. `--dry-run` prints the id and the document and needs no token.                                |
| `pin`                                                                                                                                                        | Recomputes the config hash and bumps `config.version` when it changed.                                                      |
| `sync-verify <report.json> --out <verdicts.json> [--dry-run] [--dataset-mode <create\|existing>] [--dataset <name>] [--project-id <id>] [--api-host <host>]` | Replays a sync generator report against a real Content Lake and writes one verdict per failure. See below.                  |
| `sync-file <report> <verdicts> [<report> <verdicts>...] [--dry-run] [--summary-dir <dir>]`                                                                   | Files new sync generator failures in Linear (see Sync verification).                                                        |
| `unit`                                                                                                                                                       | Runs this package's unit tests.                                                                                             |

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

## Sync verification

Three more jobs in the weekly workflow look for new sync engine bugs. They are independent of the score: a failure in them never blocks `score` or `store`.

- `sync-generate` runs the sync generator (`packages/sanity/src/core/store/document/sync/generated.sync.test.ts`) in collect mode on new seeds each ISO week (`<year><week>NN`), on both seams. The operations seam runs one seed in each of six processes because its memoize caches grow with every sequence and a process stops at 5,000 sequences, which collect-mode reruns and shrinking count toward. Each shard also keeps a few passing sequences per seed (`SYNC_GEN_SAMPLE`) for the fake fidelity check, and uploads a generator report. It holds no secrets.
- `sync-verify` replays each failure against a fresh staging dataset with `SANITY_E2E_WRITE_TOKEN` and writes a verdict per failure: `confirmed`, `fake-mismatch`, `assumed` (not verifiable, such as listener faults) or `error`. It replays the passing samples the same way and marks each `confirmed`, `fake-mismatch` or `error`, which catches the fake answering differently from the real server when no rule broke.
- `sync-file` runs `sync-file` with `LINEAR_API_KEY` and `SYNC_VERIFICATION_CLAUDE_API_KEY`. For each failure it searches the SAPP team for an issue with the exact line `sync-gen-signature: <signature>`, and skips the failure when one exists. Otherwise it files an issue in the Mutation engine coverage project with the "Sync verification bug" label. A `fake-mismatch` from a failure or a sample becomes an issue about the fake Content Lake, with no AI step, deduped on its own `sync-gen-fake-signature: <fakeSignature>` line. A gap found by a failure and by samples in the same run is filed once, with the failure's repro. A `confirmed` sample files nothing, and an `error` verdict files nothing and is listed in the job summary. The summary's "Fake fidelity" line counts how many replayed samples matched the real server, the rate to watch week over week.

The sample budget is 2 per seed on the pair shard (20 samples) and 3 on each of the six one-seed operations shards (18 samples): 38 samples a week. A passing sample sends 1.8 submissions on the pair seam and 2.5 on the operations seam on average (6 at most), so with its initial documents and a read-back per submission that is about 300 requests to the staging project, a few minutes of `sync-verify` run one report at a time, on top of the failures. Raise `sample` in the `sync-generate` matrix to widen the check.

`sync-verify` and `sync-file` run on `main` only, for the schedule or a manual dispatch, and each holds only its own secrets. Scheduled runs file for real. A manual dispatch is a dry run unless `sync_dry_run` is turned off: it still looks up duplicates, and prints every issue it would file in the job summary.

The report and verdicts shapes live in `scripts/syncVerification/contracts.ts`.

### Verifying against the real Content Lake

`sync-verify` checks the fake Content Lake against the real one for every failure in a sync generator report. It seeds the failure's `initial` documents, sends each submission the fake answered on its own, in the order the fake applied them (`settledAt`), to the actions or mutate endpoint on API version `v2025-02-19`, the version the Studio commits on, and reads the documents back after each one. It compares the status code, the error `body.type` and the documents, ignoring `_rev`, `_createdAt` and `_updatedAt`, with the same submissions replayed through `@repo/content-lake-model`. Injected rejections and submissions the fake never answered are skipped.

Document ids are prefixed with `fv-probe-<run>-f<failure>-`, and revision preconditions are rewritten to the real revisions, so failures never touch each other's documents. Each failure's documents are deleted when it finishes.

| Verdict         | Meaning                                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `confirmed`     | The real server agreed on every replayed submission.                                                                                                                      |
| `fake-mismatch` | The real server disagreed on at least one submission. `differences` lists each one.                                                                                       |
| `assumed`       | Nothing was replayed, only outside edits were replayed, or the failure also depends on a listener fault or an injected rejection, which the real server cannot reproduce. |
| `error`         | The step could not finish for that failure, or the model replayed in submission order did not reproduce the generator's recorded outcome.                                 |

Passing samples in `report.samples` are replayed the same way, after the failures, and land in `samples` in the verdicts file as `confirmed`, `fake-mismatch` or `error`. A sample is never `assumed`.

Every `fake-mismatch`, from a failure or a sample, carries a `fakeSignature` built from the first submission the real server answered differently:

```text
fake-mismatch | <actions|mutations> | <operations> | <fake status>-><real status> | <error type or document:fields>
```

The operations are the sorted action and patch operations of that request, joined with `+` like the generator's `operation` field (`document.edit:insert+document.edit:set`, `patch:insert`, `delete`). Each one is qualified by the action type or `patch`, which the generator's field leaves out since it names only the patch operations of one mutation. The signature leaves out the `_empty_action_guard_pseudo_field_` unset the form path adds. Outside writes count as `mutations`, since they go to the same endpoint. The last part is the real error type, or the fake's when only the fake rejected, and `document:` plus the differing top-level fields, joined with `+`, when only the documents differ. The signature holds no ids, revisions or values, so the same gap found by a failure and a sample files as one issue.

`--dataset-mode create`, the default, creates `cursor_ci_sync_<random>` on `SANITY_E2E_PROJECT_ID` at `api.sanity.work` and deletes it at the end, on failure and on SIGINT or SIGTERM as well. The e2e cleanup job sweeps any `cursor_ci_` dataset older than 24 hours. `--dataset-mode existing --dataset <name>` reuses a dataset and creates only the prefixed documents. The token comes from `SANITY_E2E_SESSION_TOKEN`, and `SANITY_CLI_API_RATE_LIMIT_BYPASS` is sent when it is set. `--dry-run` needs no token: it validates the report and prints what it would replay.

The command exits 0 whenever it writes the verdicts file, including when a verdict is `error`. It exits 1 for an invalid report or when it cannot delete the dataset it created.

### Filing in Linear

Dedupe matches whole lines only. An issue can carry several signature lines, and a signature that is a prefix of another never matches it. To mark a hand-filed issue as covering a signature, add the line to its `Failure signature` block.

The script owns the title, the repro (the shrunk `SyncTestDefinition`, how to run it and the commit), the real Content Lake result and the signature line. Claude writes only what happens, the user impact and the likely cause, labelled a hypothesis. The script checks its own sections are byte-identical after the AI step, and files nothing for that failure when they are not. `SYNC_VERIFICATION_CLAUDE_MODEL` overrides the model.

Run it locally with the generator report and the verdicts file of each seam. Without the keys, a dry run skips the dedupe lookup and prints a placeholder for the AI sections:

```bash
pnpm engine-confidence sync-file reports/sync-verification/report-pair-0.json reports/sync-verification/verdicts-pair-0.json --dry-run
```

## The exclusion register

`exclusions.json` lists mutants a reviewer judged meaningless to test: no input the code accepts gives a different observable result, so no test could ever catch them. `score` matches each entry to a Stryker mutant by file, mutator, replacement and original snippet, plus a `contextHash` of the surrounding lines when the same mutation repeats in a file, and reports it as `counts.excluded`, outside the ratio and apart from `counts.ignored`. Unreachable code and mutants that are only equivalent under an assumption about the input do not qualify: those get a test or get deleted. `score` fails with exit code 8 and lists the entries when one matches no mutant (the code changed, so it needs a new review), is ambiguous, duplicates the ignore rules, or matches a mutant a test detected (it was catchable, so remove it).

## The pinned config

`config.json`, `tier1.json`, `exclusions.json`, everything in `stryker/`, the Stryker patch in `patches/` and the four `@stryker-mutator/*` versions define the measurement. Their sha256 is `pinnedHash` in `config.json`. Run `pnpm engine-confidence pin` after changing any of them: it writes the new hash and increments `version`. A unit test fails when the hash is stale, so the pull request catches an unpinned change.

The catalogue and the installed Vitest version are left out of the hash, so adding an entry or bumping Vitest does not break the series.

## The Stryker runner patch

`@stryker-mutator/vitest-runner@10.0.0` joins suite and test names with a space and Vitest 5 matches names joined with `>`. Without the patch every test inside a `describe` is filtered out and the mutant is reported as survived. `patches/@stryker-mutator__vitest-runner@10.0.0.patch` fixes the join. The zero-test survivor guard in `stryker` fails the run if the patch is lost. The bug is in the runner, and the upstream fix is [stryker-js#6214](https://github.com/stryker-mutator/stryker-js/pull/6214). Drop the patch once a release includes it.

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

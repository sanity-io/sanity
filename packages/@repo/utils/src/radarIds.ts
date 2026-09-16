/**
 * Document ids in the Studio Radar dataset (project `mhfozd0z`, dataset
 * `bench`). One module so every writer agrees — perf/bench stores benchRun
 * documents, dev/radar's scripts sync git history, dev/radar's tools write
 * acks and bisect sessions — and so ids follow two rules:
 *
 * - **No dots.** A `.` makes an id a path segment (`drafts.x`,
 *   `versions.r.x`), which the API scopes and permissions differently from
 *   top-level documents — plain data must never land there by accident, as
 *   `gitTag-v6.10.1` did.
 * - **No camelCase.** Lowercase, dash-separated, so ids read the same in
 *   URLs, logs and queries.
 *
 * Ids are deterministic where the document is (commits, tags, acks, runs), so
 * `createOrReplace` upserts stay idempotent. Browser-safe: no node imports.
 * Import from `@repo/utils/radar-ids`, not the package index, in browser code.
 */

/** Collapse to a lowercase id-safe slug: runs of anything but [a-z0-9] become one dash. */
export function radarIdSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** `gitCommit` document for a main-branch commit (full 40-char sha). */
export function gitCommitId(sha: string): string {
  return `git-commit-${sha.toLowerCase()}`
}

/** `gitTag` document for a `v*` release tag, e.g. `v6.10.1` → `git-tag-v6-10-1`. */
export function gitTagId(tag: string): string {
  return `git-tag-${radarIdSlug(tag)}`
}

/**
 * `benchRun` document. A PR run overwrites one document per PR number (latest
 * push wins — branch comparison wants the newest build, not a pile); main and
 * A/B runs get one document per run (sha + CI run id) so history accumulates.
 */
export function benchRunId(run: {
  git: {sha: string; prNumber?: number}
  runner: {runId?: string}
}): string {
  return typeof run.git.prNumber === 'number'
    ? `bench-run-pr-${run.git.prNumber}`
    : radarIdSlug(`bench-run-${run.git.sha}-${run.runner.runId ?? 'local'}`)
}

/** `driftAck` document — one per metric per branch, so acking updates in place. */
export function driftAckId(metricKey: string, branch: string): string {
  return `drift-ack-${radarIdSlug(`${metricKey}:${branch}`)}`
}

/** `bisectSession` document — user-created, so a random uuid rather than a derived id. */
export function bisectSessionId(uuid: string): string {
  return `bisect-session-${radarIdSlug(uuid)}`
}

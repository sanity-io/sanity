// oxlint-disable no-console
/**
 * One-off backfill: patch existing `benchRun` documents with the weak
 * `git.commit` reference that perf/bench/report/storeShape.ts now writes for
 * new runs — so consumers can rely on the field instead of coalescing old
 * and new shapes forever. Idempotent (only touches docs missing the field);
 * safe to re-run. Run via the sync-git-metrics.yml `patch_bench_run_refs`
 * dispatch input, or locally:
 *
 *   pnpm --filter metrics-studio backfill-benchrun-refs --dry-run
 *
 * Unlike syncGitHistory.ts, --dry-run still needs BENCH_METRICS_WRITE_TOKEN:
 * finding the docs to patch requires querying the dataset.
 *
 * Docs whose sha is not a full 40-char sha (e.g. 'unknown' from a failed git
 * probe) are skipped, matching the write-time rule. PR-branch shas DO get the
 * reference — it dangles by design (weak), same as at write time.
 */
import process from 'node:process'
import {parseArgs} from 'node:util'

import {readEnv} from '@repo/utils'
import {createClient} from '@sanity/client'

const METRICS_PROJECT_ID = 'mhfozd0z'
const METRICS_DATASET = 'bench'

const FULL_SHA_RE = /^[0-9a-f]{40}$/

async function main(): Promise<void> {
  const {values} = parseArgs({
    // pnpm forwards a `--` separator verbatim; see syncGitHistory.ts
    args: process.argv.slice(2).filter((arg) => arg !== '--'),
    options: {'dry-run': {type: 'boolean', default: false}},
  })

  const client = createClient({
    projectId: METRICS_PROJECT_ID,
    dataset: METRICS_DATASET,
    apiVersion: '2025-02-19',
    token: readEnv('BENCH_METRICS_WRITE_TOKEN'),
    useCdn: false,
  })

  const docs = await client.fetch<{_id: string; sha: string | null}[]>(
    '*[_type == "benchRun" && !defined(git.commit)]{_id, "sha": git.sha}',
  )
  const patchable = docs.filter((doc) => doc.sha && FULL_SHA_RE.test(doc.sha))
  const skipped = docs.length - patchable.length
  console.log(
    `${docs.length} benchRun doc(s) missing git.commit; ${patchable.length} patchable` +
      (skipped ? `, ${skipped} skipped (no full sha)` : ''),
  )

  if (values['dry-run']) {
    for (const doc of patchable.slice(0, 5))
      console.log(`  would patch ${doc._id} -> gitCommit-${doc.sha}`)
    return
  }
  if (patchable.length === 0) return

  // Same 300-mutation batching as the sync — one unbounded transaction
  // could exceed request limits as history grows
  const BATCH = 300
  for (let offset = 0; offset < patchable.length; offset += BATCH) {
    let transaction = client.transaction()
    for (const doc of patchable.slice(offset, offset + BATCH)) {
      transaction = transaction.patch(doc._id, {
        set: {'git.commit': {_type: 'reference', _ref: `gitCommit-${doc.sha}`, _weak: true}},
      })
    }
    await transaction.commit()
  }
  console.log(`Patched ${patchable.length} doc(s) in ${METRICS_PROJECT_ID}/${METRICS_DATASET}`)
}

await main()

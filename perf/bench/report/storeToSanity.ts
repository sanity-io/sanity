// oxlint-disable no-console
/**
 * `bench store` — write a merged BenchRunDocument to the metrics-studio
 * Sanity project as a `benchRun` document (main-branch time-series tracking;
 * precedent: perf/tests stored `performanceTestRun` docs the same way).
 *
 * Requires BENCH_METRICS_WRITE_TOKEN — the only real secret in the suite,
 * used exclusively by the daily track-main cron.
 */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import {fileURLToPath} from 'node:url'

import {readEnv} from '@repo/utils'
import {createClient} from '@sanity/client'

import {toStorableRun} from './storeShape'
import {type BenchRunDocument} from './types'

/** The metrics-studio project (browse the data with dev/metrics-studio). */
const METRICS_PROJECT_ID = 'mhfozd0z'
const METRICS_DATASET = 'bench'

export async function storeRun(inputPathArg?: string): Promise<void> {
  const inputPath = path.resolve(
    inputPathArg ??
      path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'results', 'merged.json'),
  )

  if (!fs.existsSync(inputPath)) {
    console.error(`No merged result document at ${inputPath} — run \`pnpm bench report\` first`)
    process.exit(1)
  }

  const run = JSON.parse(fs.readFileSync(inputPath, 'utf8')) as BenchRunDocument

  const client = createClient({
    projectId: METRICS_PROJECT_ID,
    dataset: METRICS_DATASET,
    apiVersion: '2025-02-19',
    token: readEnv('BENCH_METRICS_WRITE_TOKEN'),
    useCdn: false,
  })

  const documentId = `benchRun-${run.git.sha}-${run.runner.runId ?? 'local'}`
  const stored = await client.createOrReplace({...toStorableRun(run), _id: documentId})
  console.log(
    `Stored ${stored._id} (${run.scenarios.length} scenario report(s), sha ${run.git.sha.slice(0, 10)}) in ${METRICS_PROJECT_ID}/${METRICS_DATASET}`,
  )
}

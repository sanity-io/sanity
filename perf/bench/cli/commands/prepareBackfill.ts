/**
 * `bench prepare-backfill` — build the *experiment* dist from an older
 * main-history commit's packages with HEAD's committed perf/bench tree
 * overlaid: the same worktree/overlay recipe as `prepare-reference`, aimed
 * at `perf/bench/dist` instead of `.reference/dist`.
 *
 * Exists to repair holes in the daily main-branch time series after a
 * harness outage: dispatch the bench workflow with `backfill_sha` for each
 * missed day, and the suite measures that commit with today's harness,
 * storing the result under the historical sha (the workflow passes it
 * through as BENCH_GIT_SHA — see report/collect.ts).
 *
 * Unlike prepare-reference there is no absolute-mode fallback — a backfill
 * that cannot build the requested commit must fail loudly, since that
 * commit's measurement is the whole point of the run.
 */
import path from 'node:path'

import {object} from '@optique/core/constructs'
import {message} from '@optique/core/message'
import {type InferValue} from '@optique/core/parser'
import {command, constant, option} from '@optique/core/primitives'
import {string} from '@optique/core/valueparser'

import {BENCH_ROOT} from '../benchRoot'
import {buildDistAtCommit} from './prepareReference'

export const prepareBackfillCommand = command(
  'prepare-backfill',
  object({
    action: constant('prepare-backfill'),
    sha: option('--sha', string({metavar: 'SHA'}), {
      description: message`Full 40-char sha of the commit whose packages to build (the harness and scenarios come from HEAD)`,
    }),
  }),
  {
    description: message`CI: build the experiment studio at a historical commit to backfill the daily time series`,
  },
)

export type PrepareBackfillArgs = InferValue<typeof prepareBackfillCommand>

export function prepareBackfill(argv: PrepareBackfillArgs): void {
  // Full length required — the workflow stamps the run documents with this
  // raw value (BENCH_GIT_SHA), and the stored series identifies commits by
  // their full sha; an abbreviated sha would store a point that never joins
  // the daily runs for the same commit. Also catches typos and leading-dash
  // values git would misparse as options (not a security boundary —
  // spawnSync array args, no shell).
  if (!/^[0-9a-f]{40}$/i.test(argv.sha)) {
    throw new Error(`--sha must be a full 40-char commit hash, got ${JSON.stringify(argv.sha)}`)
  }
  buildDistAtCommit(argv.sha, path.join(BENCH_ROOT, 'dist'))
}

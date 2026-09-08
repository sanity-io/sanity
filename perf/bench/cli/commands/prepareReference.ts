// oxlint-disable no-console
/**
 * `bench prepare-reference` — CI setup for A/B comparisons: build the
 * reference studio from the merge-base's packages with HEAD's perf/bench
 * harness (same harness + scenarios on both sides — only product code
 * differs), and place the dist where the workflow uploads it.
 *
 * Replaces a bash `run:` block that broke twice on shell semantics (a `cd`
 * leaking out of a function, and `set -e` silently ignored in condition
 * contexts) — the logic lives here so those failure classes are
 * structurally impossible. The build recipe itself is buildDistAtCommit.ts.
 *
 * A failed build falls back to absolute mode (`comparison=skipped`) instead
 * of failing: a missing comparison must never block unrelated work (see
 * perf/bench/README.md). The bootstrap case — a merge-base that predates
 * perf/bench entirely — takes the same fallback.
 */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import {object} from '@optique/core/constructs'
import {message} from '@optique/core/message'
import {optional, withDefault} from '@optique/core/modifiers'
import {type InferValue} from '@optique/core/parser'
import {command, constant, option} from '@optique/core/primitives'
import {string} from '@optique/core/valueparser'

import {BENCH_ROOT} from '../benchRoot'
import {buildDistAtCommit, git, REPO_ROOT, setOutput} from './buildDistAtCommit'

export const prepareReferenceCommand = command(
  'prepare-reference',
  object({
    action: constant('prepare-reference'),
    baseRef: withDefault(
      option('--base-ref', string({metavar: 'REF'}), {
        description: message`Base branch the PR merges into (merge-base is resolved against origin/REF)`,
      }),
      'main',
    ),
    at: optional(
      option('--at', string({metavar: 'SHA'}), {
        description: message`Build the reference at this exact commit instead of the merge-base (A/B dispatch; full 40-char sha; fails loudly, no absolute-mode fallback)`,
      }),
    ),
  }),
  {
    description: message`CI: build the reference studio at the merge-base for A/B comparison (set CACHE_HIT=true to reuse a restored dist)`,
  },
)

export type PrepareReferenceArgs = InferValue<typeof prepareReferenceCommand>

export function prepareReference(argv: PrepareReferenceArgs): void {
  const referenceDist = path.join(BENCH_ROOT, '.reference/dist')

  // Explicit reference commit (`ab_from`/`ab_to` dispatch): no merge-base, no
  // cache, and no absolute-mode fallback — the comparison IS the run, so a
  // reference that cannot build must fail it (mirrors prepare-backfill).
  if (argv.at) {
    if (!/^[0-9a-f]{40}$/i.test(argv.at)) {
      throw new Error(`--at must be a full 40-char commit hash, got ${JSON.stringify(argv.at)}`)
    }
    setOutput('merge_base', argv.at)
    buildDistAtCommit(argv.at, referenceDist)
    setOutput('comparison', 'ab')
    return
  }

  const mergeBase = git(['merge-base', 'HEAD', `origin/${argv.baseRef}`], REPO_ROOT)
  setOutput('merge_base', mergeBase)

  // Re-pushes to a PR usually share the merge-base: the workflow restores
  // the built reference from its cache and sets CACHE_HIT
  if (process.env.CACHE_HIT === 'true' && fs.existsSync(path.join(referenceDist, 'index.html'))) {
    console.log('Reference dist restored from cache')
    setOutput('comparison', 'ab')
    return
  }

  try {
    buildDistAtCommit(mergeBase, referenceDist)
    setOutput('comparison', 'ab')
  } catch (error) {
    const reason = (error instanceof Error ? error.message : String(error)).replace(/\s+/g, ' ')
    // `::warning::` renders as a GitHub annotation; locally it's a log line
    console.log(
      `::warning::Reference build at merge-base failed or predates perf/bench - running in absolute mode (${reason})`,
    )
    setOutput('comparison', 'skipped')
  }
}

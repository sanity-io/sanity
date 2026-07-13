// oxlint-disable no-console
/**
 * `bench prepare-reference` — CI setup for A/B comparisons: build the
 * reference studio from the merge-base's packages with HEAD's perf/bench
 * tree overlaid (same harness + scenarios on both sides — only product code
 * differs), and place the dist where the workflow uploads it.
 *
 * Replaces a bash `run:` block that broke twice on shell semantics (a `cd`
 * leaking out of a function, and `set -e` silently ignored in condition
 * contexts) — the logic lives here so those failure classes are
 * structurally impossible.
 *
 * A failed build falls back to absolute mode (`comparison=skipped`) instead
 * of failing: a missing comparison must never block unrelated work (see
 * perf/bench/README.md). The bootstrap case — a merge-base that predates
 * perf/bench entirely — takes the same fallback.
 */
import {spawnSync} from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import {object} from '@optique/core/constructs'
import {message} from '@optique/core/message'
import {withDefault} from '@optique/core/modifiers'
import {type InferValue} from '@optique/core/parser'
import {command, constant, option} from '@optique/core/primitives'
import {string} from '@optique/core/valueparser'

import {BENCH_ROOT} from '../benchRoot'

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
  }),
  {
    description: message`CI: build the reference studio at the merge-base for A/B comparison (set CACHE_HIT=true to reuse a restored dist)`,
  },
)

export type PrepareReferenceArgs = InferValue<typeof prepareReferenceCommand>

const REPO_ROOT = path.dirname(path.dirname(BENCH_ROOT))

function git(args: string[], cwd: string): string {
  const result = spawnSync('git', args, {cwd, encoding: 'utf8'})
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr?.trim()}`)
  }
  return result.stdout.trim()
}

function step(executable: string, args: string[], cwd: string): void {
  const result = spawnSync(executable, args, {cwd, stdio: 'inherit'})
  if (result.status !== 0) {
    throw new Error(`${executable} ${args.join(' ')} exited with status ${result.status}`)
  }
}

/** Write a step output for the workflow, and echo it for humans/local runs. */
function setOutput(key: string, value: string): void {
  console.log(`${key}=${value}`)
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`)
  }
}

export function prepareReference(argv: PrepareReferenceArgs): void {
  const referenceDist = path.join(BENCH_ROOT, '.reference/dist')
  const mergeBase = git(['merge-base', 'HEAD', `origin/${argv.baseRef}`], REPO_ROOT)
  setOutput('merge_base', mergeBase)

  // Re-pushes to a PR usually share the merge-base: the workflow restores
  // the built reference from its cache and sets CACHE_HIT
  if (process.env.CACHE_HIT === 'true' && fs.existsSync(path.join(referenceDist, 'index.html'))) {
    console.log('Reference dist restored from cache')
    setOutput('comparison', 'ab')
    return
  }

  const worktree = path.resolve(REPO_ROOT, '..', 'reference')
  try {
    const headSha = git(['rev-parse', 'HEAD'], REPO_ROOT)
    step('git', ['worktree', 'add', worktree, mergeBase], REPO_ROOT)
    // Bootstrap: merge-base may predate perf/bench entirely
    if (!fs.existsSync(path.join(worktree, 'perf/bench'))) {
      throw new Error(`merge-base ${mergeBase.slice(0, 10)} predates perf/bench`)
    }
    // Overlay HEAD's committed perf/bench tree onto the merge-base worktree;
    // remove first so files deleted at HEAD don't linger
    fs.rmSync(path.join(worktree, 'perf/bench'), {recursive: true, force: true})
    step('git', ['checkout', headSha, '--', 'perf/bench'], worktree)
    step('pnpm', ['install', '--no-frozen-lockfile'], worktree)
    step('pnpm', ['turbo', 'run', 'build', '--filter=bench'], worktree)

    const builtDist = path.join(worktree, 'perf/bench/dist')
    if (!fs.existsSync(path.join(builtDist, 'index.html'))) {
      throw new Error(`reference build produced no ${path.join(builtDist, 'index.html')}`)
    }
    fs.rmSync(referenceDist, {recursive: true, force: true})
    fs.mkdirSync(path.dirname(referenceDist), {recursive: true})
    fs.cpSync(builtDist, referenceDist, {recursive: true})
    setOutput('comparison', 'ab')
  } catch (error) {
    const reason = (error instanceof Error ? error.message : String(error)).replace(/\s+/g, ' ')
    // `::warning::` renders as a GitHub annotation; locally it's a log line
    console.log(
      `::warning::Reference build at merge-base failed or predates perf/bench - running in absolute mode (${reason})`,
    )
    setOutput('comparison', 'skipped')
  } finally {
    // CI runners are ephemeral; locally, don't leave the worktree behind
    if (!process.env.CI) {
      spawnSync('git', ['worktree', 'remove', '--force', worktree], {cwd: REPO_ROOT})
    }
  }
}

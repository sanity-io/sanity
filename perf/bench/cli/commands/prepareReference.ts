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
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'

import {object} from '@optique/core/constructs'
import {message} from '@optique/core/message'
import {optional, withDefault} from '@optique/core/modifiers'
import {type InferValue} from '@optique/core/parser'
import {command, constant, option} from '@optique/core/primitives'
import {string} from '@optique/core/valueparser'

import {BENCH_ROOT} from '../benchRoot'
import {linkHarnessModules} from './linkHarnessModules'

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

const REPO_ROOT = path.dirname(path.dirname(BENCH_ROOT))

export function git(args: string[], cwd: string): string {
  const result = spawnSync('git', args, {cwd, encoding: 'utf8'})
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr?.trim()}`)
  }
  return result.stdout.trim()
}

function step(executable: string, args: string[], cwd: string, env?: Record<string, string>): void {
  const result = spawnSync(executable, args, {
    cwd,
    stdio: 'inherit',
    ...(env ? {env: {...process.env, ...env}} : {}),
  })
  if (result.status !== 0) {
    throw new Error(`${executable} ${args.join(' ')} exited with status ${result.status}`)
  }
}

/** Write a step output for the workflow, and echo it for humans/local runs. */
export function setOutput(key: string, value: string): void {
  console.log(`${key}=${value}`)
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`)
  }
}

/**
 * Build the bench studio from `sha`'s packages with HEAD's committed
 * perf/bench tree overlaid (same harness + scenarios — only product code
 * differs), and copy the built dist to `targetDist`. Throws on any failure;
 * callers decide whether that's a fallback (prepare-reference) or fatal
 * (prepare-backfill).
 */
export function buildDistAtCommit(sha: string, targetDist: string): void {
  // A unique temp dir, never a repo sibling: a fixed `../reference` could
  // collide with an unrelated directory that the finally block would then
  // `git worktree remove --force`. Not inside the repo either — the nested
  // checkout would be picked up by test/build globs (e.g. vitest's
  // `./**/__tests__/**`)
  const worktree = fs.mkdtempSync(path.join(os.tmpdir(), 'bench-worktree-'))
  try {
    const headSha = git(['rev-parse', 'HEAD'], REPO_ROOT)
    step('git', ['worktree', 'add', worktree, sha], REPO_ROOT)
    // Bootstrap: the commit may predate perf/bench entirely
    if (!fs.existsSync(path.join(worktree, 'perf/bench'))) {
      throw new Error(`commit ${sha.slice(0, 10)} predates perf/bench`)
    }
    // Install BEFORE overlaying: a frozen install of the pristine historical
    // tree is a bit-exact replay of that commit's own CI install — no
    // resolution happens, so the supply-chain age gate has nothing to judge
    // and product dependencies are provably historical
    step('pnpm', ['install', '--frozen-lockfile'], worktree)

    // Overlay HEAD's committed perf/bench tree onto the worktree;
    // remove first so files deleted at HEAD don't linger (this also drops
    // the historical harness node_modules — replaced below)
    fs.rmSync(path.join(worktree, 'perf/bench'), {recursive: true, force: true})
    step('git', ['checkout', headSha, '--', 'perf/bench'], worktree)

    // Borrow HEAD's installed harness dependencies instead of installing
    // them (see linkHarnessModules.ts): no resolution, no lockfile edits —
    // the toolchain is the very bytes HEAD's CI vetted, and workspace deps
    // are remapped so the harness builds the historical product
    linkHarnessModules({repoRoot: REPO_ROOT, worktree})

    // The overlaid harness manifest intentionally disagrees with the
    // historical lockfile, and pnpm's verify-deps-before-run check (on by
    // default in pnpm 11) reacts to that by silently re-installing — a fresh
    // registry resolution that both defeats the borrowed install and
    // re-exposes the build to the supply-chain age gate. Turbo runs every
    // task through `pnpm run`, so the check must be disabled via environment
    // for the whole process tree. pnpm 11 only reads `pnpm_config_*` env
    // keys, underscored (verified against v11.17/v11.21; `npm_config_*` and
    // dashed spellings are ignored). Turbo is also invoked from .bin rather
    // than through `pnpm turbo` so the outer wrapper never re-checks either.
    step(
      path.join(worktree, 'node_modules/.bin/turbo'),
      ['run', 'build', '--filter=bench'],
      worktree,
      {pnpm_config_verify_deps_before_run: 'false'},
    )

    // Tripwire: if any pnpm invocation inside the build re-installed anyway
    // (say, a turbo or pnpm version that filters the env override above), it
    // re-resolved against the registry and rewrote the worktree lockfile.
    // Fail loudly rather than measure a silently re-resolved harness.
    if (git(['status', '--porcelain', '--', 'pnpm-lock.yaml'], worktree) !== '') {
      throw new Error(
        'the build modified the worktree lockfile — a nested pnpm install ran despite verify-deps-before-run being disabled',
      )
    }

    const builtDist = path.join(worktree, 'perf/bench/dist')
    if (!fs.existsSync(path.join(builtDist, 'index.html'))) {
      throw new Error(
        `build at ${sha.slice(0, 10)} produced no ${path.join(builtDist, 'index.html')}`,
      )
    }
    fs.rmSync(targetDist, {recursive: true, force: true})
    fs.mkdirSync(path.dirname(targetDist), {recursive: true})
    fs.cpSync(builtDist, targetDist, {recursive: true})
  } finally {
    // CI runners are ephemeral; locally, don't leave the worktree behind
    if (!process.env.CI) {
      spawnSync('git', ['worktree', 'remove', '--force', worktree], {cwd: REPO_ROOT})
      // If `worktree add` never ran (or `remove` refused), the temp dir remains
      fs.rmSync(worktree, {recursive: true, force: true})
    }
  }
}

export function prepareReference(argv: PrepareReferenceArgs): void {
  const referenceDist = path.join(BENCH_ROOT, '.reference/dist')

  // Explicit reference commit (`ab_reference`/`ab_experiment` dispatch): no merge-base, no
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

// oxlint-disable no-console
/**
 * Build the bench studio at a historical commit — the recipe behind
 * `prepare-reference` (A/B reference, merge-base) and `prepare-backfill`.
 *
 * Two throwaway checkouts, one job each:
 *
 * - **product** — a worktree at `sha`, installed with `--frozen-lockfile`
 *   (a replay of that commit's own CI install: no resolution, nothing for
 *   the supply-chain age gate to judge), built, and packed into tarballs
 *   exactly as `npm publish` would: `sanity` and the workspace packages it
 *   depends on (`@sanity/types`, `@sanity/schema`, …).
 * - **harness** — a sparse worktree of HEAD's *committed* tree holding only
 *   `perf/bench` and the internal `@repo/*` tooling it needs (uncommitted
 *   harness edits are not measured). The tarballs are wired in as
 *   `overrides` in its `pnpm-workspace.yaml`, so `sanity` and every
 *   transitive `@sanity/*` request resolve to the historical build, while
 *   the studio's own peers (react, styled-components) keep HEAD's lockfile
 *   pins. `sanity build` then runs there exactly as it would in any studio
 *   that installed those versions from npm.
 *
 * Third-party dependencies of the historical `sanity` resolve fresh (newest
 * in range on the day of the build) rather than from the commit's lockfile.
 * That is deliberate: the series tracks regressions in *our* code surface,
 * and re-measuring an old sha after an upstream fix answers "does the old
 * studio still regress with the fixed dependency" — the frozen-lockfile
 * replay could never run that experiment. The invoking checkout's files are
 * never touched. The one side effect is git's own: `git sparse-checkout set`
 * in a linked worktree turns on `extensions.worktreeConfig` in the shared
 * `.git/config` so the worktree can carry its own `core.sparseCheckout`.
 * Both trees are removed afterwards outside CI.
 */
import {spawnSync} from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'

import {parseDocument} from 'yaml'

import {BENCH_ROOT} from '../benchRoot'

export const REPO_ROOT = path.dirname(path.dirname(BENCH_ROOT))

/** The package the bench studio imports — everything else it needs comes from HEAD. */
const PRODUCT_PACKAGE = 'sanity'

/** Shape of `pnpm ls --depth -1 --json` entries. */
export interface WorkspaceProject {
  name: string
  version: string
  path: string
  private?: boolean
}

/** The dependency maps of a package.json that `pnpm update <name>` acts on. */
export interface Manifest {
  name: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
}

export function git(args: string[], cwd: string): string {
  return capture('git', args, cwd)
}

function capture(executable: string, args: string[], cwd: string): string {
  const result = spawnSync(executable, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (result.status !== 0) {
    throw new Error(`${executable} ${args.join(' ')} failed: ${result.stderr?.trim()}`)
  }
  return result.stdout.trim()
}

function step(executable: string, args: string[], cwd: string): void {
  console.log(`\n$ ${executable} ${args.join(' ')}  (in ${cwd})`)
  const result = spawnSync(executable, args, {cwd, stdio: 'inherit'})
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

function readManifest(dir: string): Manifest {
  return JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')) as Manifest
}

/** Workspace projects selected by pnpm filter expressions (e.g. `sanity...` = sanity and the workspace packages it depends on). */
function listProjects(cwd: string, filters: string[]): WorkspaceProject[] {
  const args = [
    'ls',
    ...filters.flatMap((filter) => ['--filter', filter]),
    '--depth',
    '-1',
    '--json',
  ]
  return JSON.parse(capture('pnpm', args, cwd)) as WorkspaceProject[]
}

/** The tarball name `pnpm pack` produces: scope without `@`, `/` → `-`. */
export function tarballFilename(name: string, version: string): string {
  return `${name.replace(/^@/, '').replace('/', '-')}-${version}.tgz`
}

/**
 * Add `overrides` entries to a pnpm-workspace.yaml text, merged into the
 * existing `overrides:` block when there is one. Edits the parsed document
 * so comments and the rest of the file survive. (pnpm 11 reads overrides
 * from here only — the `pnpm` field in package.json is ignored.)
 */
export function withOverrides(yaml: string, overrides: Record<string, string>): string {
  const document = parseDocument(yaml)
  for (const [name, spec] of Object.entries(overrides)) {
    document.setIn(['overrides', name], spec)
  }
  return document.toString()
}

/**
 * The manifest's direct dependencies that a tarball replaces — the names
 * `pnpm update` has to be pointed at (see installHarness).
 */
export function packedDirectDependencies(
  manifest: Manifest,
  packed: ReadonlySet<string>,
): string[] {
  const direct = new Set([
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.devDependencies ?? {}),
    ...Object.keys(manifest.optionalDependencies ?? {}),
  ])
  return [...direct].filter((name) => packed.has(name)).sort()
}

/**
 * Repo-relative project directories the sparse harness checkout must
 * contain: the given projects (the harness's workspace dependencies plus
 * the root manifest's — pnpm resolves the root importer even when it is
 * filtered out) minus the packages the tarballs replace. The root itself is
 * always part of a sparse checkout.
 */
export function sparseCheckoutPaths(
  projects: WorkspaceProject[],
  options: {repoRoot: string; replaced: ReadonlySet<string>},
): string[] {
  const dirs = new Set<string>()
  for (const project of projects) {
    if (options.replaced.has(project.name)) continue
    const relative = path.relative(options.repoRoot, project.path)
    if (relative === '') continue
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(
        `workspace project ${project.name} at ${project.path} is outside ${options.repoRoot}`,
      )
    }
    dirs.add(relative)
  }
  return [...dirs].sort()
}

/**
 * Build the bench studio from `sha`'s packages with HEAD's `perf/bench`
 * harness, and copy the built dist to `targetDist`. With
 * `customizationsDist`, the customization studio (studio-customizations/,
 * what settle mode measures) is built from the same harness install — HEAD's
 * workspaces over the historical `sanity` — and copied there too. Throws on
 * any failure; callers decide whether that's a fallback (prepare-reference)
 * or fatal (prepare-backfill).
 */
export function buildDistAtCommit(
  sha: string,
  targetDist: string,
  options: {customizationsDist?: string} = {},
): void {
  // A unique temp dir, never a repo sibling or a nested dir: a fixed path
  // could collide with something the finally block then removes, and a
  // nested checkout would be picked up by test/build globs
  const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'bench-historical-'))
  const productTree = path.join(stage, 'product')
  const harnessTree = path.join(stage, 'harness')
  try {
    const tarballs = packProductAt(sha, productTree, path.join(stage, 'tarballs'))
    installHarness(git(['rev-parse', 'HEAD'], REPO_ROOT), harnessTree, tarballs)

    const harness = path.join(harnessTree, path.relative(REPO_ROOT, BENCH_ROOT))
    step('pnpm', ['run', 'build'], harness)
    copyBuiltDist(sha, path.join(harness, 'dist'), targetDist)

    if (options.customizationsDist) {
      // Best effort: the customization workspaces are HEAD's components
      // compiled against the historical sanity, and an API they use may not
      // exist at that commit. That must not block repairing the pristine
      // series — warn, leave the dist absent, and let the settle step skip.
      try {
        step('pnpm', ['run', 'build:customizations'], harness)
        copyBuiltDist(sha, path.join(harness, 'dist-customizations'), options.customizationsDist)
      } catch (error) {
        const reason = (error instanceof Error ? error.message : String(error)).replace(/\s+/g, ' ')
        fs.rmSync(options.customizationsDist, {recursive: true, force: true})
        console.log(
          `::warning::Customization studio did not build at ${sha.slice(0, 10)} - settle mode is skipped for this run (${reason})`,
        )
      }
    }
  } finally {
    // CI runners are ephemeral; locally, don't leave the trees behind
    if (!process.env.CI) {
      for (const tree of [productTree, harnessTree]) {
        spawnSync('git', ['worktree', 'remove', '--force', tree], {cwd: REPO_ROOT})
      }
      fs.rmSync(stage, {recursive: true, force: true})
    }
  }
}

/** Replace `targetDist` with a built studio, refusing an empty or failed build. */
function copyBuiltDist(sha: string, builtDist: string, targetDist: string): void {
  if (!fs.existsSync(path.join(builtDist, 'index.html'))) {
    throw new Error(
      `build at ${sha.slice(0, 10)} produced no ${path.join(builtDist, 'index.html')}`,
    )
  }
  fs.rmSync(targetDist, {recursive: true, force: true})
  fs.mkdirSync(path.dirname(targetDist), {recursive: true})
  fs.cpSync(builtDist, targetDist, {recursive: true})
}

/**
 * Check out `sha`, replay its install, build `sanity` and the workspace
 * packages it depends on, and pack them. Returns package name → tarball path.
 */
function packProductAt(sha: string, tree: string, tarballDir: string): Map<string, string> {
  step('git', ['worktree', 'add', tree, sha], REPO_ROOT)
  if (!fs.existsSync(path.join(tree, 'packages', PRODUCT_PACKAGE))) {
    throw new Error(`commit ${sha.slice(0, 10)} has no packages/${PRODUCT_PACKAGE}`)
  }
  step('pnpm', ['install', '--frozen-lockfile'], tree)
  // pnpm's `sanity...`: sanity and the workspace packages it depends on
  const productFilter = `${PRODUCT_PACKAGE}...`
  const publishable = listProjects(tree, [productFilter]).filter((project) => !project.private)
  step('pnpm', ['exec', 'turbo', 'run', 'build', `--filter=${productFilter}`], tree)

  fs.mkdirSync(tarballDir)
  const tarballs = new Map<string, string>()
  for (const project of publishable) {
    step('pnpm', ['pack', '--pack-destination', tarballDir], project.path)
    const tarball = path.join(tarballDir, tarballFilename(project.name, project.version))
    if (!fs.existsSync(tarball)) {
      throw new Error(`pnpm pack of ${project.name} did not produce ${tarball}`)
    }
    tarballs.set(project.name, tarball)
  }
  return tarballs
}

/**
 * Sparse-check out HEAD's harness into `tree`, point its workspace at the
 * tarballs via overrides, and install it.
 */
function installHarness(headSha: string, tree: string, tarballs: Map<string, string>): void {
  const harness = readManifest(BENCH_ROOT)
  const harnessPath = path.relative(REPO_ROOT, BENCH_ROOT)
  const projects = listProjects(REPO_ROOT, [
    `${harness.name}...`,
    `${readManifest(REPO_ROOT).name}...`,
  ])
  // realpath both sides of the comparison: the repo may be reached through a
  // symlink, and pnpm's reported paths need not agree with REPO_ROOT on that
  const dirs = sparseCheckoutPaths(
    projects.map((project) => ({...project, path: fs.realpathSync(project.path)})),
    {repoRoot: fs.realpathSync(REPO_ROOT), replaced: new Set(tarballs.keys())},
  )

  step('git', ['worktree', 'add', '--no-checkout', tree, headSha], REPO_ROOT)
  step('git', ['sparse-checkout', 'set', ...dirs], tree)
  step('git', ['checkout'], tree)

  const workspaceFile = path.join(tree, 'pnpm-workspace.yaml')
  const overrides = Object.fromEntries(
    [...tarballs].map(([name, tarball]) => [name, `file:${tarball}`]),
  )
  fs.writeFileSync(workspaceFile, withOverrides(fs.readFileSync(workspaceFile, 'utf8'), overrides))

  // `pnpm install` would honour the overrides everywhere except where it
  // matters most: for the harness's own `workspace:*` dependencies it keeps
  // the lockfile's recorded `link:` to the (now absent) workspace package.
  // `pnpm update` of exactly those dependencies re-resolves them — and
  // installs the filtered projects in the same pass — so it is the install
  // step. Everything else keeps HEAD's lockfile pins.
  const direct = packedDirectDependencies(harness, new Set(tarballs.keys()))
  if (direct.length === 0) {
    throw new Error(`${harness.name} does not depend on any packed package — nothing to measure`)
  }
  step('pnpm', ['--filter', `${harness.name}...`, 'update', ...direct], tree)

  // Tripwire: the harness must have got the tarball, not a workspace link
  // or a registry copy of the same version number
  const installed = fs.realpathSync(path.join(tree, harnessPath, 'node_modules', PRODUCT_PACKAGE))
  if (!installed.includes(`${PRODUCT_PACKAGE}@file+`)) {
    throw new Error(`${PRODUCT_PACKAGE} resolved to ${installed}, not to the packed tarball`)
  }
}

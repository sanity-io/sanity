/**
 * Borrowed harness dependencies for the worktree build recipe
 * (buildDistAtCommit).
 *
 * The recipe overlays HEAD's `perf/bench` onto a historical commit. HEAD's
 * harness dependency ranges have no answer in the historical lockfile, so
 * installing them in the worktree would force a fresh registry resolution —
 * unvetted versions, judged by the supply-chain age gate at whatever moment
 * the build happens to run (a recurring, timing-dependent failure class:
 * pnpm has no mature-version fallback).
 *
 * But almost everything the harness needs is already installed: the
 * historical worktree install provides the harness dependencies of the
 * measured commit (kept — dependencies bundled into the studio are product
 * code, with peer links correctly inside the worktree), and the invoking
 * repo's HEAD install provides anything the harness gained since. This
 * function fills the gaps in the worktree's `perf/bench/node_modules` from
 * the invoking repo's:
 *
 * - entries the historical install already has are left untouched;
 * - workspace dependencies (`sanity`, `@repo/*`, …) are remapped into the
 *   worktree, so the harness builds the *historical* product;
 * - everything else links to the invoking repo's entry, whose realpath is
 *   HEAD's `.pnpm` store — the very bytes HEAD's CI vetted. Their own
 *   imports resolve at their physical location (Node follows realpaths).
 *
 * The worktree's own install runs *before* the overlay, `--frozen-lockfile`
 * on the pristine historical tree: a bit-exact replay of that commit's CI
 * install, with no resolution for the age gate to judge. No lockfile,
 * manifest, or workspace-config file is ever rewritten.
 */
import fs from 'node:fs'
import path from 'node:path'

export function linkHarnessModules(options: {
  repoRoot: string
  worktree: string
  /** Repo-relative path of the harness package. */
  benchPath?: string
}): void {
  const {repoRoot, worktree, benchPath = 'perf/bench'} = options
  const sourceRoot = path.join(repoRoot, benchPath, 'node_modules')
  const targetRoot = path.join(worktree, benchPath, 'node_modules')
  if (!fs.existsSync(sourceRoot)) {
    throw new Error(`no installed harness dependencies at ${sourceRoot} — run pnpm install first`)
  }
  // realpath the boundary once: entries are classified by where their
  // realpath lands, and the repo itself may live behind a symlink
  const realRepoRoot = fs.realpathSync(repoRoot)

  const linkDirectory = (sourceDir: string, targetDir: string): void => {
    fs.mkdirSync(targetDir, {recursive: true})
    for (const entry of fs.readdirSync(sourceDir, {withFileTypes: true})) {
      // pnpm bookkeeping files (.modules.yaml etc.) describe the *source*
      // install and must not travel; .bin must (it's how scripts find tools)
      if (entry.name.startsWith('.') && entry.name !== '.bin') continue
      const sourcePath = path.join(sourceDir, entry.name)
      const targetPath = path.join(targetDir, entry.name)

      // Scoped-package dirs and .bin are real directories of links — recurse
      if (entry.isDirectory()) {
        linkDirectory(sourcePath, targetPath)
        continue
      }

      // Fill-only: entries the historical install already provides stay
      // historical. Dependencies bundled into the measured studio (react,
      // plugins) are product code, and their store-internal peer links
      // already point into the worktree — a borrowed HEAD copy would carry
      // peer links to HEAD's (possibly unbuilt) workspace packages instead.
      // This also makes reruns idempotent (no EEXIST).
      if (fs.lstatSync(targetPath, {throwIfNoEntry: false})) continue

      const real = fs.realpathSync(sourcePath)
      const repoRelative = path.relative(realRepoRoot, real)
      const isWorkspacePath =
        !repoRelative.startsWith('..') &&
        !path.isAbsolute(repoRelative) &&
        !repoRelative.split(path.sep).includes('node_modules')
      if (isWorkspacePath) {
        // A workspace package (or a bin inside one): the harness must get the
        // measured commit's copy, not HEAD's
        const mapped = path.join(worktree, repoRelative)
        if (!fs.existsSync(mapped)) {
          throw new Error(
            `harness dependency '${repoRelative}' does not exist at the measured commit`,
          )
        }
        fs.symlinkSync(mapped, targetPath)
      } else {
        fs.symlinkSync(real, targetPath)
      }
    }
  }

  linkDirectory(sourceRoot, targetRoot)
}

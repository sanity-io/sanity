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
 * But HEAD's harness install already exists, fully materialized and vetted,
 * in the invoking repo: this recipe always runs from a HEAD checkout whose
 * `perf/bench/node_modules` is exactly what main's CI installs. So instead
 * of reconstructing it, borrow it — recreate the worktree harness's
 * node_modules as symlinks into the invoking repo's install:
 *
 * - workspace dependencies (`sanity`, `@repo/*`, …) are remapped into the
 *   worktree, so the harness builds the *historical* product;
 * - everything else links to the invoking repo's entry, whose realpath is
 *   HEAD's `.pnpm` store — the very bytes HEAD's CI vetted. Their own
 *   imports resolve at their physical location (Node follows realpaths), so
 *   the whole toolchain graph stays coherently HEAD's.
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
  // Replace any pre-existing target wholesale so the function is idempotent —
  // in the recipe the overlay checkout guarantees a clean slate, but a rerun
  // against a reused worktree must not trip over stale links (EEXIST)
  fs.rmSync(targetRoot, {recursive: true, force: true})

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

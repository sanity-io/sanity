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
 * - toolchain dependencies (vite, tsx, playwright, …) link to the invoking
 *   repo's entry, whose realpath is HEAD's `.pnpm` store — the very bytes
 *   HEAD's CI vetted. Their own imports resolve at their physical location
 *   (Node follows realpaths), so the whole toolchain graph stays coherently
 *   HEAD's;
 * - bundled dependencies — studio plugins such as
 *   sanity-plugin-internationalized-array, recognisable because pnpm laid
 *   workspace packages (`@sanity/util`, `sanity`) out next to them in the
 *   store — cannot be borrowed that way: at HEAD's physical location their
 *   imports reach HEAD's *product* packages, which are neither the measured
 *   commit's nor built in the reference job (the reference build failed on
 *   `@sanity/util/content`). They resolve against the worktree instead: the
 *   measured commit's own install of the same version where its lockfile has
 *   one, so the plugin shares one `@sanity/ui`, `rxjs`, … with the product
 *   just like on the experiment side; otherwise a copy of HEAD's bytes under
 *   `node_modules/.borrowed`, laid out pnpm-style next to links that send
 *   its workspace dependencies into the worktree. Applied recursively — a
 *   plugin's own dependencies (`@sanity/language-filter`, `@sanity/assist`)
 *   link into the workspace too.
 *
 * The worktree's own install runs *before* the overlay, `--frozen-lockfile`
 * on the pristine historical tree: a bit-exact replay of that commit's CI
 * install, with no resolution for the age gate to judge. No lockfile,
 * manifest, or workspace-config file is ever rewritten.
 */
import fs from 'node:fs'
import path from 'node:path'

/** A package pnpm installed at `<virtual store>/<key>/node_modules/<name>`. */
interface StoreEntry {
  /** realpath of the package directory */
  real: string
  /** the virtual store (`node_modules/.pnpm`), relative to the repo root — the worktree has one at the same path */
  storeRelative: string
  /** `name@version_<peers>` — names the directory holding the package and its dependencies */
  key: string
  /** `name` or `@scope/name` */
  name: string
  /** the dependencies pnpm laid out next to the package, by realpath */
  siblings: Array<{name: string; real: string}>
}

function readVersion(packageDir: string): string | null {
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8'))
    return typeof manifest.version === 'string' ? manifest.version : null
  } catch {
    return null
  }
}

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

  /**
   * Repo-relative path of a workspace package (or a file inside one); null
   * for registry packages (their realpath runs through `node_modules`) and
   * for anything outside the repo.
   */
  const workspaceRelative = (real: string): string | null => {
    const relative = path.relative(realRepoRoot, real)
    if (relative.startsWith('..') || path.isAbsolute(relative)) return null
    if (relative.split(path.sep).includes('node_modules')) return null
    return relative
  }

  /** The measured commit's copy of a workspace path — the harness must never get HEAD's */
  const intoWorktree = (relative: string): string => {
    const mapped = path.join(worktree, relative)
    if (!fs.existsSync(mapped)) {
      throw new Error(`harness dependency '${relative}' does not exist at the measured commit`)
    }
    return mapped
  }

  const storeEntries = new Map<string, StoreEntry | null>()
  /** Describe a realpath as a virtual-store entry, or null when it is not laid out as one */
  const storeEntry = (real: string): StoreEntry | null => {
    const cached = storeEntries.get(real)
    if (cached !== undefined) return cached

    // <store>/<key>/node_modules/<name>, where <name> may be `@scope/name`
    let siblingDir = path.dirname(real)
    if (path.basename(siblingDir).startsWith('@')) siblingDir = path.dirname(siblingDir)
    const keyDir = path.dirname(siblingDir)
    const store = path.dirname(keyDir)
    const storeRelative = path.relative(realRepoRoot, store)
    const isStoreLayout =
      path.basename(siblingDir) === 'node_modules' &&
      path.basename(store) === '.pnpm' &&
      !storeRelative.startsWith('..') &&
      !path.isAbsolute(storeRelative)
    if (!isStoreLayout) {
      storeEntries.set(real, null)
      return null
    }

    const name = path.relative(siblingDir, real).split(path.sep).join('/')
    const siblings: StoreEntry['siblings'] = []
    const collect = (dir: string, scope: string): void => {
      for (const dirent of fs.readdirSync(dir, {withFileTypes: true})) {
        if (dirent.name.startsWith('.')) continue
        const siblingName = scope + dirent.name
        if (siblingName === name) continue
        const siblingPath = path.join(dir, dirent.name)
        if (dirent.isDirectory() && dirent.name.startsWith('@')) {
          collect(siblingPath, `${siblingName}/`)
          continue
        }
        try {
          siblings.push({name: siblingName, real: fs.realpathSync(siblingPath)})
        } catch {
          // a dangling link (e.g. an optional peer pnpm skipped) resolves to nothing
        }
      }
    }
    collect(siblingDir, '')

    const entry = {real, storeRelative, key: path.basename(keyDir), name, siblings}
    storeEntries.set(real, entry)
    return entry
  }

  const worktreeStoreKeys = new Map<string, string[]>()
  /**
   * The measured commit's own install of the same package version, if its
   * lockfile resolved one: the same registry bytes, but with dependencies
   * that point into the worktree's graph. The store key carries a peer
   * suffix that changes whenever a peer was bumped in between, so match on
   * `name@version` and merely prefer the identical key.
   */
  const inWorktreeStore = (entry: StoreEntry): string | null => {
    const version = readVersion(entry.real)
    if (version === null) return null
    const store = path.join(worktree, entry.storeRelative)
    let keys = worktreeStoreKeys.get(store)
    if (keys === undefined) {
      keys = fs.existsSync(store) ? fs.readdirSync(store).sort() : []
      worktreeStoreKeys.set(store, keys)
    }
    const prefix = `${entry.name.replace('/', '+')}@${version}`
    const candidates = keys.filter((key) => key === prefix || key.startsWith(`${prefix}_`))
    for (const key of [entry.key, ...candidates]) {
      const candidate = path.join(store, key, 'node_modules', entry.name)
      if (readVersion(candidate) === version) return candidate
    }
    return null
  }

  const borrowedRoot = path.join(targetRoot, '.borrowed')
  const materialized = new Map<string, string>()
  /**
   * HEAD's bytes with the measured commit's neighbours: copy the package to
   * `.borrowed/<key>/node_modules/<name>` and lay out links for each
   * dependency pnpm had put next to it, so that its imports still resolve
   * one directory up — into the worktree for workspace packages.
   */
  const materialize = (entry: StoreEntry): string => {
    const existing = materialized.get(entry.real)
    if (existing !== undefined) return existing
    const siblingDir = path.join(borrowedRoot, entry.key, 'node_modules')
    const copy = path.join(siblingDir, entry.name)
    // Registered before descending: peer relationships make sibling graphs cyclic
    materialized.set(entry.real, copy)
    fs.mkdirSync(path.dirname(copy), {recursive: true})
    fs.cpSync(entry.real, copy, {recursive: true})
    for (const sibling of entry.siblings) {
      const link = path.join(siblingDir, sibling.name)
      fs.mkdirSync(path.dirname(link), {recursive: true})
      fs.symlinkSync(resolveDependency(sibling.real, true), link)
    }
    return copy
  }

  /**
   * Where the worktree's link for a dependency installed at `real` (in HEAD's
   * repo) must point. `bundled` marks a dependency reached from a bundled
   * package: it ships in the studio too, so it should come from the measured
   * commit's install wherever that has the same version.
   */
  const resolveDependency = (real: string, bundled: boolean): string => {
    const relative = workspaceRelative(real)
    if (relative !== null) return intoWorktree(relative)
    const entry = storeEntry(real)
    if (entry === null) return real
    const linksIntoWorkspace = entry.siblings.some(
      (sibling) => workspaceRelative(sibling.real) !== null,
    )
    // Toolchain: HEAD's install, whose graph is coherently HEAD's at its realpath
    if (!bundled && !linksIntoWorkspace) return real
    return inWorktreeStore(entry) ?? (linksIntoWorkspace ? materialize(entry) : real)
  }

  const linkDirectory = (sourceDir: string, targetDir: string): void => {
    fs.mkdirSync(targetDir, {recursive: true})
    for (const dirent of fs.readdirSync(sourceDir, {withFileTypes: true})) {
      // pnpm bookkeeping files (.modules.yaml etc.) describe the *source*
      // install and must not travel; .bin must (it's how scripts find tools)
      if (dirent.name.startsWith('.') && dirent.name !== '.bin') continue
      const sourcePath = path.join(sourceDir, dirent.name)
      const targetPath = path.join(targetDir, dirent.name)

      // Scoped-package dirs and .bin are real directories of links — recurse
      if (dirent.isDirectory()) {
        linkDirectory(sourcePath, targetPath)
        continue
      }

      fs.symlinkSync(resolveDependency(fs.realpathSync(sourcePath), false), targetPath)
    }
  }

  linkDirectory(sourceRoot, targetRoot)
}

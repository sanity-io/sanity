import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {afterEach, beforeEach, describe, expect, it} from 'vitest'

import {linkHarnessModules} from '../linkHarnessModules'

let repoRoot: string
let worktree: string

/**
 * Create `<root>/node_modules/.pnpm/<key>/node_modules/<name>` the way pnpm
 * lays a package out: its files, a manifest carrying `version`, and a
 * symlink per dependency next to it.
 */
function addStorePackage(
  root: string,
  key: string,
  name: string,
  version: string,
  files: Record<string, string>,
  siblings: Record<string, string> = {},
): string {
  const siblingDir = path.join(root, 'node_modules/.pnpm', key, 'node_modules')
  const pkg = path.join(siblingDir, name)
  fs.mkdirSync(pkg, {recursive: true})
  fs.writeFileSync(path.join(pkg, 'package.json'), JSON.stringify({name, version}))
  for (const [file, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(pkg, file), content)
  }
  for (const [sibling, target] of Object.entries(siblings)) {
    fs.mkdirSync(path.dirname(path.join(siblingDir, sibling)), {recursive: true})
    fs.symlinkSync(target, path.join(siblingDir, sibling))
  }
  return pkg
}

function storePath(root: string, key: string, name: string): string {
  return path.join(root, 'node_modules/.pnpm', key, 'node_modules', name)
}

const PLUGIN_KEY = 'plugin@1.0.0_sanity@packages+sanity'

/**
 * A miniature invoking repo: a pnpm-shaped store, workspace packages, and a
 * perf/bench/node_modules mixing every entry shape the borrowed install must handle —
 * toolchain store symlinks, workspace symlinks, scoped dirs, .bin links into both
 * worlds, pnpm bookkeeping files that must not travel, and a bundled plugin whose
 * store entry links back into the workspace.
 */
beforeEach(() => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'borrowed-harness-test-'))
  repoRoot = path.join(base, 'repo')
  worktree = path.join(base, 'worktree')

  const store = addStorePackage(repoRoot, 'chalk@5.0.0', 'chalk', '5.0.0', {
    'index.js': 'store copy',
  })
  const scopedStore = addStorePackage(repoRoot, '@scope+pkg@1.0.0', '@scope/pkg', '1.0.0', {})

  const sanityPkg = path.join(repoRoot, 'packages/sanity')
  fs.mkdirSync(path.join(sanityPkg, 'bin'), {recursive: true})
  fs.writeFileSync(path.join(sanityPkg, 'bin/sanity.js'), 'head cli')
  const utilPkg = path.join(repoRoot, 'packages/@scope/util')
  fs.mkdirSync(utilPkg, {recursive: true})
  fs.writeFileSync(path.join(utilPkg, 'index.js'), 'head util')

  // A dependency of the plugin that itself depends on a workspace package
  const helper = addStorePackage(
    repoRoot,
    'helper@2.0.0_sanity@packages+sanity',
    'helper',
    '2.0.0',
    {'index.js': 'head helper'},
    {sanity: sanityPkg},
  )
  // The bundled plugin: pnpm laid workspace packages out next to it
  const plugin = addStorePackage(
    repoRoot,
    PLUGIN_KEY,
    'plugin',
    '1.0.0',
    {'index.js': 'head plugin'},
    {'@scope/util': utilPkg, 'sanity': sanityPkg, 'chalk': store, 'helper': helper},
  )

  const modules = path.join(repoRoot, 'perf/bench/node_modules')
  fs.mkdirSync(path.join(modules, '@scope'), {recursive: true})
  fs.mkdirSync(path.join(modules, '.bin'))
  fs.symlinkSync(store, path.join(modules, 'chalk'))
  fs.symlinkSync(scopedStore, path.join(modules, '@scope/pkg'))
  fs.symlinkSync(sanityPkg, path.join(modules, 'sanity'))
  fs.symlinkSync(plugin, path.join(modules, 'plugin'))
  fs.symlinkSync(path.join(sanityPkg, 'bin/sanity.js'), path.join(modules, '.bin/sanity'))
  fs.symlinkSync(path.join(store, 'index.js'), path.join(modules, '.bin/chalk'))
  fs.writeFileSync(path.join(modules, '.modules.yaml'), 'bookkeeping')

  // The worktree has the workspace packages (historical copies) but no harness
  fs.mkdirSync(path.join(worktree, 'packages/sanity/bin'), {recursive: true})
  fs.writeFileSync(path.join(worktree, 'packages/sanity/bin/sanity.js'), 'historical cli')
  fs.mkdirSync(path.join(worktree, 'packages/@scope/util'), {recursive: true})
  fs.writeFileSync(path.join(worktree, 'packages/@scope/util/index.js'), 'historical util')
  fs.mkdirSync(path.join(worktree, 'perf/bench'), {recursive: true})
  fs.mkdirSync(path.join(worktree, 'node_modules/.pnpm'), {recursive: true})
})

afterEach(() => {
  fs.rmSync(path.dirname(repoRoot), {recursive: true, force: true})
})

describe('linkHarnessModules', () => {
  it('links store dependencies to the head install and remaps workspace deps into the worktree', () => {
    linkHarnessModules({repoRoot, worktree})
    const target = path.join(worktree, 'perf/bench/node_modules')

    expect(fs.readFileSync(path.join(target, 'chalk/index.js'), 'utf8')).toBe('store copy')
    expect(fs.realpathSync(path.join(target, 'chalk'))).toBe(
      fs.realpathSync(storePath(repoRoot, 'chalk@5.0.0', 'chalk')),
    )
    // Workspace dep resolves to the *worktree's* copy, not HEAD's
    expect(fs.readFileSync(path.join(target, 'sanity/bin/sanity.js'), 'utf8')).toBe(
      'historical cli',
    )
  })

  it('recurses into scoped dirs and .bin, remapping workspace bins', () => {
    linkHarnessModules({repoRoot, worktree})
    const target = path.join(worktree, 'perf/bench/node_modules')

    expect(fs.existsSync(path.join(target, '@scope/pkg'))).toBe(true)
    expect(fs.readFileSync(path.join(target, '.bin/sanity'), 'utf8')).toBe('historical cli')
    expect(fs.readFileSync(path.join(target, '.bin/chalk'), 'utf8')).toBe('store copy')
  })

  it('does not carry pnpm bookkeeping files over', () => {
    linkHarnessModules({repoRoot, worktree})
    expect(fs.existsSync(path.join(worktree, 'perf/bench/node_modules/.modules.yaml'))).toBe(false)
  })

  it('throws when a workspace dependency is missing at the measured commit', () => {
    fs.rmSync(path.join(worktree, 'packages/sanity'), {recursive: true})
    expect(() => linkHarnessModules({repoRoot, worktree})).toThrow(/does not exist at the measured/)
  })

  it('replaces a stale target so reruns are deterministic', () => {
    const stale = path.join(worktree, 'perf/bench/node_modules')
    fs.mkdirSync(stale, {recursive: true})
    fs.writeFileSync(path.join(stale, 'leftover.txt'), 'stale')

    linkHarnessModules({repoRoot, worktree})
    // Running twice must also work (EEXIST regression guard)
    linkHarnessModules({repoRoot, worktree})

    expect(fs.existsSync(path.join(stale, 'leftover.txt'))).toBe(false)
    expect(fs.readFileSync(path.join(stale, 'chalk/index.js'), 'utf8')).toBe('store copy')
  })

  it('throws when the head harness install is missing', () => {
    fs.rmSync(path.join(repoRoot, 'perf/bench/node_modules'), {recursive: true})
    expect(() => linkHarnessModules({repoRoot, worktree})).toThrow(/run pnpm install first/)
  })

  describe('bundled dependencies (store entries that link into the workspace)', () => {
    it("links to the measured commit's own install of the same version, preferring the identical store key", () => {
      // Another consumer resolved the plugin with other peers: same version,
      // both acceptable, but the identical key wins even though the other
      // variant sorts first
      addStorePackage(worktree, 'plugin@1.0.0_react@19.0.0', 'plugin', '1.0.0', {
        'index.js': 'historical install, other peers',
      })
      addStorePackage(worktree, PLUGIN_KEY, 'plugin', '1.0.0', {
        'index.js': 'historical install, same peers',
      })

      linkHarnessModules({repoRoot, worktree})

      const link = path.join(worktree, 'perf/bench/node_modules/plugin')
      expect(fs.realpathSync(link)).toBe(fs.realpathSync(storePath(worktree, PLUGIN_KEY, 'plugin')))
      expect(fs.readFileSync(path.join(link, 'index.js'), 'utf8')).toBe(
        'historical install, same peers',
      )
    })

    it('falls back to any peer variant of the same version', () => {
      addStorePackage(worktree, 'plugin@1.0.0_react@19.0.0', 'plugin', '1.0.0', {
        'index.js': 'historical install',
      })
      // A different version must never be mistaken for it, nor a longer version
      addStorePackage(worktree, 'plugin@1.0.0-beta.1', 'plugin', '1.0.0-beta.1', {})
      addStorePackage(worktree, 'plugin@1.0.01', 'plugin', '1.0.01', {})

      linkHarnessModules({repoRoot, worktree})

      expect(fs.realpathSync(path.join(worktree, 'perf/bench/node_modules/plugin'))).toBe(
        fs.realpathSync(storePath(worktree, 'plugin@1.0.0_react@19.0.0', 'plugin')),
      )
    })

    it("materializes head's copy with its workspace links remapped when the measured commit installed another version", () => {
      addStorePackage(worktree, 'plugin@0.9.0', 'plugin', '0.9.0', {'index.js': 'older plugin'})

      linkHarnessModules({repoRoot, worktree})

      const link = path.join(worktree, 'perf/bench/node_modules/plugin')
      const copy = fs.realpathSync(link)
      // A real copy inside the worktree, so Node resolves its imports from here…
      expect(copy).toBe(
        fs.realpathSync(
          path.join(
            worktree,
            'perf/bench/node_modules/.borrowed',
            PLUGIN_KEY,
            'node_modules/plugin',
          ),
        ),
      )
      expect(fs.lstatSync(copy).isSymbolicLink()).toBe(false)
      expect(fs.readFileSync(path.join(copy, 'index.js'), 'utf8')).toBe('head plugin')
      // …where its workspace dependencies are the measured commit's…
      const siblings = path.dirname(copy)
      expect(fs.readFileSync(path.join(siblings, '@scope/util/index.js'), 'utf8')).toBe(
        'historical util',
      )
      expect(fs.readFileSync(path.join(siblings, 'sanity/bin/sanity.js'), 'utf8')).toBe(
        'historical cli',
      )
      // …and a registry dependency the measured commit never installed stays HEAD's
      expect(fs.realpathSync(path.join(siblings, 'chalk'))).toBe(
        fs.realpathSync(storePath(repoRoot, 'chalk@5.0.0', 'chalk')),
      )
    })

    it("takes a bundled dependency's registry siblings from the measured commit's install too", () => {
      addStorePackage(worktree, 'chalk@5.0.0', 'chalk', '5.0.0', {'index.js': 'historical chalk'})

      linkHarnessModules({repoRoot, worktree})

      const target = path.join(worktree, 'perf/bench/node_modules')
      const siblings = path.dirname(fs.realpathSync(path.join(target, 'plugin')))
      // Reached from the bundled plugin: the worktree's copy, shared with the product
      expect(fs.readFileSync(path.join(siblings, 'chalk/index.js'), 'utf8')).toBe(
        'historical chalk',
      )
      // The harness's own chalk is toolchain and stays HEAD's, same version or not
      expect(fs.realpathSync(path.join(target, 'chalk'))).toBe(
        fs.realpathSync(storePath(repoRoot, 'chalk@5.0.0', 'chalk')),
      )
    })

    it('recurses into dependencies that link into the workspace themselves', () => {
      linkHarnessModules({repoRoot, worktree})

      const plugin = fs.realpathSync(path.join(worktree, 'perf/bench/node_modules/plugin'))
      const helper = fs.realpathSync(path.join(path.dirname(plugin), 'helper'))
      expect(helper).toBe(
        fs.realpathSync(
          path.join(
            worktree,
            'perf/bench/node_modules/.borrowed/helper@2.0.0_sanity@packages+sanity/node_modules/helper',
          ),
        ),
      )
      expect(fs.readFileSync(path.join(helper, 'index.js'), 'utf8')).toBe('head helper')
      expect(fs.readFileSync(path.join(helper, '../sanity/bin/sanity.js'), 'utf8')).toBe(
        'historical cli',
      )
    })

    it('materializes each package once, even across cyclic sibling graphs', () => {
      // helper also depends on the plugin (a peer cycle, as pnpm lays them out)
      fs.symlinkSync(
        storePath(repoRoot, PLUGIN_KEY, 'plugin'),
        path.join(storePath(repoRoot, 'helper@2.0.0_sanity@packages+sanity', 'plugin')),
      )

      linkHarnessModules({repoRoot, worktree})

      const plugin = fs.realpathSync(path.join(worktree, 'perf/bench/node_modules/plugin'))
      const helper = fs.realpathSync(path.join(path.dirname(plugin), 'helper'))
      expect(fs.realpathSync(path.join(path.dirname(helper), 'plugin'))).toBe(plugin)
      expect(
        fs.readdirSync(path.join(worktree, 'perf/bench/node_modules/.borrowed')).sort(),
      ).toEqual(['helper@2.0.0_sanity@packages+sanity', PLUGIN_KEY])
    })

    it("throws when a bundled dependency's workspace link is missing at the measured commit", () => {
      fs.rmSync(path.join(worktree, 'packages/@scope/util'), {recursive: true})
      expect(() => linkHarnessModules({repoRoot, worktree})).toThrow(
        /'packages\/@scope\/util' does not exist at the measured commit/,
      )
    })
  })
})

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {afterEach, beforeEach, describe, expect, it} from 'vitest'

import {linkHarnessModules} from '../linkHarnessModules'

let repoRoot: string
let worktree: string

/**
 * A miniature invoking repo: a pnpm-shaped store, a workspace package, and a
 * perf/bench/node_modules mixing every entry shape the borrowed install must handle —
 * store symlinks, workspace symlinks, scoped dirs, .bin links into both
 * worlds, and pnpm bookkeeping files that must not travel.
 */
beforeEach(() => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'borrowed-harness-test-'))
  repoRoot = path.join(base, 'repo')
  worktree = path.join(base, 'worktree')

  const store = path.join(repoRoot, 'node_modules/.pnpm/chalk@5.0.0/node_modules/chalk')
  fs.mkdirSync(store, {recursive: true})
  fs.writeFileSync(path.join(store, 'index.js'), 'store copy')
  const scopedStore = path.join(
    repoRoot,
    'node_modules/.pnpm/@scope+pkg@1.0.0/node_modules/@scope/pkg',
  )
  fs.mkdirSync(scopedStore, {recursive: true})

  const sanityPkg = path.join(repoRoot, 'packages/sanity')
  fs.mkdirSync(path.join(sanityPkg, 'bin'), {recursive: true})
  fs.writeFileSync(path.join(sanityPkg, 'bin/sanity.js'), 'head cli')

  const modules = path.join(repoRoot, 'perf/bench/node_modules')
  fs.mkdirSync(path.join(modules, '@scope'), {recursive: true})
  fs.mkdirSync(path.join(modules, '.bin'))
  fs.symlinkSync(store, path.join(modules, 'chalk'))
  fs.symlinkSync(scopedStore, path.join(modules, '@scope/pkg'))
  fs.symlinkSync(sanityPkg, path.join(modules, 'sanity'))
  fs.symlinkSync(path.join(sanityPkg, 'bin/sanity.js'), path.join(modules, '.bin/sanity'))
  fs.symlinkSync(path.join(store, 'index.js'), path.join(modules, '.bin/chalk'))
  fs.writeFileSync(path.join(modules, '.modules.yaml'), 'bookkeeping')

  // The worktree has the workspace package (historical copy) but no harness
  fs.mkdirSync(path.join(worktree, 'packages/sanity/bin'), {recursive: true})
  fs.writeFileSync(path.join(worktree, 'packages/sanity/bin/sanity.js'), 'historical cli')
  fs.mkdirSync(path.join(worktree, 'perf/bench'), {recursive: true})
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
      fs.realpathSync(path.join(repoRoot, 'node_modules/.pnpm/chalk@5.0.0/node_modules/chalk')),
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

  it('throws when the head harness install is missing', () => {
    fs.rmSync(path.join(repoRoot, 'perf/bench/node_modules'), {recursive: true})
    expect(() => linkHarnessModules({repoRoot, worktree})).toThrow(/run pnpm install first/)
  })
})

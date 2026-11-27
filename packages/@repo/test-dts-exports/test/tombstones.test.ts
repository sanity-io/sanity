/**
 * Export tombstones: type-only `@deprecated` `never` declarations for names `sanity@latest`
 * exports and the workspace removed or moved. See AGENTS.md ("Export tombstones (v7)").
 */
import {readFileSync} from 'node:fs'
import path from 'node:path'

import {describe, expect, it} from 'vitest'

import {
  diffSurfaces,
  entryImportPath,
  fetchPublishedPackage,
  findBrokenReplacementImports,
  formatSurfaceDiff,
  parseReplacementImports,
  isSameType,
  readManifest,
  readSurface,
  type Surface,
  WORKSPACE_PACKAGE_DIR,
} from '../tombstones/surface.mjs'

const manifest = readManifest()
const workspace = readSurface(WORKSPACE_PACKAGE_DIR)

/**
 * True when the entry's JS (or a local module it re-exports from) lists `name` as a runtime
 * export. Reads the source text so the studio graph never has to be executed.
 */
function jsExportsName(libDir: string, entryJs: string, name: string): boolean {
  const visited = new Set<string>()
  const queue = [entryJs]
  while (queue.length > 0) {
    const file = queue.pop()!
    if (visited.has(file)) continue
    visited.add(file)
    let source: string
    try {
      source = readFileSync(path.join(libDir, file), 'utf8')
    } catch {
      continue
    }
    for (const block of source.matchAll(/export\s*\{([^}]+)\}/g)) {
      for (const spec of block[1].split(',')) {
        const parts = spec
          .trim()
          .split(/\s+as\s+/)
          .map((part) => part.trim())
        if ((parts[1] ?? parts[0]) === name) return true
      }
    }
    if (new RegExp(`export\\s+(?:async\\s+)?function\\s+${name}\\b`).test(source)) return true
    if (new RegExp(`export\\s+(?:const|let|var|class)\\s+${name}\\b`).test(source)) return true
    for (const match of source.matchAll(
      /export\s*(?:\*|\{[^}]*\})\s*from\s*["']\.\/([^"']+)["']/g,
    )) {
      queue.push(match[1].endsWith('.js') ? match[1] : `${match[1]}.js`)
    }
  }
  return false
}

describe('export tombstones', () => {
  const {exports} = JSON.parse(
    readFileSync(path.join(WORKSPACE_PACKAGE_DIR, 'package.json'), 'utf8'),
  ) as {exports: Record<string, {default: string}>}

  for (const [entry, tombstones] of Object.entries(manifest.tombstones)) {
    it(`${entryImportPath(entry)}: every tombstone is never with its @deprecated message`, () => {
      const problems = tombstones.flatMap(({name, message}) => {
        const info = workspace[entry]?.[name]
        if (!info) return [`${name}: not exported from the built .d.ts`]
        if (!info.tombstone) return [`${name}: exported, but not as a never tombstone`]
        if (info.deprecated !== message) {
          return [`${name}: @deprecated is ${JSON.stringify(info.deprecated)}`]
        }
        return []
      })
      expect(
        problems,
        'Rebuild with `pnpm --filter sanity build` after running ' +
          '`node packages/sanity/src/_exports/tombstones/generate.mjs`.',
      ).toEqual([])
    })

    it(`${entryImportPath(entry)}: no tombstone is a runtime export`, () => {
      const libDir = path.join(WORKSPACE_PACKAGE_DIR, 'lib')
      const entryJs = path.relative(
        libDir,
        path.join(WORKSPACE_PACKAGE_DIR, exports[entry].default),
      )
      const leaked = tombstones
        .filter(({name}) => jsExportsName(libDir, entryJs, name))
        .map(({name}) => name)
      expect(leaked, 'Tombstones must be type-only and never emit JavaScript.').toEqual([])
    })
  }

  it('every replacement import a message names is exported by the entry it names', () => {
    expect(
      findBrokenReplacementImports({workspace, manifest}).map(
        ({entry, name, replacement, reason}) =>
          `${name} in ${entryImportPath(entry)}: ${replacement}: ${reason}`,
      ),
      'Point the message at an entry that exports the name and run ' +
        '`node packages/sanity/src/_exports/tombstones/generate.mjs`.',
    ).toEqual([])
  })

  // Downloads and walks the published package's .d.ts, which takes longer than the default 5s.
  it(
    'cover every export sanity@latest has and the workspace removed or moved',
    {timeout: 120_000},
    async () => {
      const {version, packageDir} = await fetchPublishedPackage()
      const published = readSurface(packageDir)
      const diff = diffSurfaces({published, workspace, manifest})
      const report = formatSurfaceDiff(diff, version)
      if (report) throw new Error(report)

      const kindMismatches = Object.entries(manifest.tombstones).flatMap(([entry, tombstones]) =>
        tombstones
          .filter(
            ({name, kind}) => published[entry]?.[name] && published[entry][name].kind !== kind,
          )
          .map(({name, kind}) => `${entryImportPath(entry)}: ${name} is a ${kind} tombstone`),
      )
      expect(
        kindMismatches,
        'A tombstone must have the kind sanity@latest exported the name as (a value needs ' +
          '`export declare const`, a type `export type`).',
      ).toEqual([])
    },
  )
})

describe('diffSurfaces', () => {
  const real = {kind: 'value', tombstone: false, deprecated: undefined} as const
  const tombstone = {kind: 'value', tombstone: true, deprecated: 'Removed.'} as const
  const published: Surface = {
    '.': {kept: real, removed: real, moved: real, covered: real},
    './old': {thing: real},
  }

  it('reports removed and moved exports that no tombstone covers', () => {
    const diff = diffSurfaces({
      published,
      workspace: {'.': {kept: real, covered: tombstone}, './new': {moved: real}},
      manifest: {
        removedEntries: ['./old'],
        tombstones: {'.': [{name: 'covered', kind: 'value', message: 'Removed.'}]},
      },
    })
    expect(diff.missing).toEqual([
      {entry: '.', name: 'moved', kind: 'value', exportedFrom: ['./new'], unrelated: []},
      {entry: '.', name: 'removed', kind: 'value', exportedFrom: [], unrelated: []},
    ])
    expect(diff.stale).toEqual([])
    expect(formatSurfaceDiff(diff, '1.0.0')).toMatch(
      /- moved \(value\) from sanity: now exported from sanity\/new\. Add to "tombstones"\["\."\]: \{"name":"moved","kind":"value","message":"Moved to `sanity\/new`\./,
    )
  })

  it('reports entries removed without a removedEntries record', () => {
    const diff = diffSurfaces({
      published,
      workspace: {'.': {kept: real, removed: real, moved: real, covered: real}},
      manifest: {removedEntries: [], tombstones: {}},
    })
    expect(diff.missingEntries).toEqual(['./old'])
  })

  it('reports tombstones that cover nothing', () => {
    const diff = diffSurfaces({
      published,
      workspace: {
        '.': {kept: real, removed: real, moved: real, covered: real, invented: tombstone},
      },
      manifest: {
        removedEntries: ['./old', '.'],
        tombstones: {
          '.': [
            {name: 'kept', kind: 'value', message: 'Removed.'},
            {name: 'invented', kind: 'value', message: 'Removed.'},
          ],
          './gone': [{name: 'thing', kind: 'value', message: 'Removed.'}],
        },
      },
    })
    expect(diff.stale).toEqual([
      {entry: '.', name: 'kept', reason: 'it is exported'},
      {entry: '.', name: 'invented', reason: 'the published package never exported it'},
      {entry: './gone', name: 'thing', reason: 'the workspace has no ./gone entry'},
    ])
    expect(diff.staleRemovedEntries).toEqual(['. (still exported)'])
  })

  it('reports values that an entry now only exports as a type', () => {
    const typeOnly = {kind: 'type', tombstone: false, deprecated: undefined} as const
    const diff = diffSurfaces({
      published: {'.': {demoted: real, keptType: typeOnly}},
      workspace: {'.': {demoted: typeOnly, keptType: typeOnly}, './new': {demoted: real}},
      manifest: {removedEntries: [], tombstones: {}},
    })
    expect(diff.missing).toEqual([
      {
        entry: '.',
        name: 'demoted',
        kind: 'value',
        exportedFrom: ['./new'],
        unrelated: [],
        typeOnly: true,
      },
    ])
  })

  it('reports tombstones that point at an entry which does not export the name', () => {
    const diff = diffSurfaces({
      published: {'.': {moved: real, removed: real}},
      workspace: {
        '.': {moved: tombstone, removed: tombstone},
        './old-home': {},
        './new-home': {moved: real},
      },
      manifest: {
        removedEntries: [],
        tombstones: {
          '.': [
            {name: 'moved', kind: 'value', message: 'Moved to `sanity/old-home`.'},
            {name: 'removed', kind: 'value', message: 'Removed.'},
          ],
        },
      },
    })
    expect(diff.misdirected).toEqual([
      {
        entry: '.',
        name: 'moved',
        kind: 'value',
        target: './old-home',
        exportedFrom: ['./new-home'],
      },
    ])
    expect(formatSurfaceDiff(diff, '1.0.0')).toMatch(
      /- moved in sanity points at sanity\/old-home, but it is exported from sanity\/new-home\. Suggested: "Moved to `sanity\/new-home`\./,
    )
  })

  it('reports tombstones that point at an entry exporting a different type of that name', () => {
    const typed = (...shape: string[]) => ({...real, kind: 'type', shape}) as const
    const diff = diffSurfaces({
      published: {
        '.': {
          Same: typed('id', 'author', 'timestamp'),
          Other: typed('id', 'author', 'timestamp'),
          Gone: typed('id', 'author', 'timestamp'),
        },
      },
      workspace: {
        '.': {Same: tombstone, Other: tombstone, Gone: tombstone},
        './new': {
          Same: typed('id', 'author', 'timestamp', 'added'),
          Other: typed('id', 'mutations', 'type'),
          Gone: typed('mutations', 'type'),
        },
      },
      manifest: {
        removedEntries: [],
        tombstones: {
          '.': [
            {name: 'Same', kind: 'type', message: 'Moved to `sanity/new`.'},
            {name: 'Other', kind: 'type', message: 'Moved to `sanity/new`.'},
            {name: 'Gone', kind: 'type', message: 'Removed in v7.'},
          ],
        },
      },
    })
    expect(diff.unrelated).toEqual([{entry: '.', name: 'Other', target: './new'}])
    expect(diff.misdirected).toEqual([])
    expect(formatSurfaceDiff(diff, '1.0.0')).toMatch(
      /- Other in sanity points at sanity\/new, whose Other is not the type sanity@1\.0\.0 exported/,
    )
  })

  it('suggests a removal when the only export of the name is an unrelated type', () => {
    const typed = (...shape: string[]) => ({...real, kind: 'type', shape}) as const
    const diff = diffSurfaces({
      published: {'.': {Name: typed('a', 'b', 'c')}},
      workspace: {'.': {}, './new': {Name: typed('x', 'y', 'z')}},
      manifest: {removedEntries: [], tombstones: {}},
    })
    expect(diff.missing).toEqual([
      {entry: '.', name: 'Name', kind: 'type', exportedFrom: [], unrelated: ['./new']},
    ])
    expect(formatSurfaceDiff(diff, '1.0.0')).toMatch(
      /Add to "tombstones"\["\."\]: \{"name":"Name","kind":"type","message":"Removed in v7\. `sanity\/new` exports an unrelated `Name`\./,
    )
  })
})

describe('isSameType', () => {
  it('accepts declarations that share at least half the names of the smaller one', () => {
    expect(isSameType(['a', 'b', 'c'], ['a', 'b', 'c', 'd', 'e', 'f'])).toBe(true)
    expect(isSameType(['a', 'b'], ['a', 'x', 'y', 'z'])).toBe(true)
    expect(isSameType(['a', 'b', 'c'], ['a', 'x', 'y'])).toBe(false)
    expect(isSameType(['a', 'b'], ['x', 'y'])).toBe(false)
  })

  it('never tells apart declarations without a shape', () => {
    expect(isSameType(undefined, ['a'])).toBe(true)
    expect(isSameType(['a'], [])).toBe(true)
  })
})

describe('findBrokenReplacementImports', () => {
  const real = {kind: 'value', tombstone: false, deprecated: undefined} as const
  const tombstone = {kind: 'value', tombstone: true, deprecated: 'Removed.'} as const
  const workspace: Surface = {
    '.': {gone: tombstone, useIt: real},
    './internals': {useIt: real, useItLegacy: real},
    './internals/2': {useIt: real, useItLegacy: real, lazyOnly: real},
  }

  it('parses names, lists, hooks and "the same entry"', () => {
    expect(
      parseReplacementImports(
        'Use `a` and `b` from `sanity/x`. Or the `c` hook from `sanity/y`, then `{d}` from the same entry. Not `e` from `@sanity/types`.',
      ),
    ).toEqual([
      {names: ['a', 'b'], importPath: 'sanity/x'},
      {names: ['c'], importPath: 'sanity/y'},
      {names: ['d'], importPath: 'sanity/y'},
    ])
  })

  it('reports a name its entry does not export, including through "the same entry"', () => {
    const message =
      'Removed. Use `lazyOnly` from `sanity/internals` or `useIt` from `sanity/internals`, and `useItLegacy` from the same entry.'
    expect(
      findBrokenReplacementImports({
        workspace,
        manifest: {removedEntries: [], tombstones: {'.': [{name: 'gone', kind: 'value', message}]}},
      }),
    ).toEqual([
      {
        entry: '.',
        name: 'gone',
        replacement: 'lazyOnly',
        importPath: 'sanity/internals',
        reason: 'sanity/internals does not export lazyOnly',
      },
    ])
  })

  it('reports names that the entry only tombstones, and entries the workspace lacks', () => {
    const message = 'Use `gone` from `sanity`, or `useIt` from `sanity/missing`.'
    expect(
      findBrokenReplacementImports({
        workspace,
        manifest: {removedEntries: [], tombstones: {'.': [{name: 'gone', kind: 'value', message}]}},
      }).map(({reason}) => reason),
    ).toEqual(['sanity does not export gone', 'the workspace has no sanity/missing entry'])
  })

  it('reports "the same entry" without a preceding entry', () => {
    expect(
      findBrokenReplacementImports({
        workspace,
        manifest: {
          removedEntries: [],
          tombstones: {
            '.': [{name: 'gone', kind: 'value', message: 'Use `useIt` from the same entry.'}],
          },
        },
      }).map(({reason}) => reason),
    ).toEqual(['the message says "the same entry" but names no entry before it'])
  })
})

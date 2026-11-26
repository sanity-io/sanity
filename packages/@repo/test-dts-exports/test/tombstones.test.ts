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
  formatSurfaceDiff,
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
      {entry: '.', name: 'moved', kind: 'value', exportedFrom: ['./new']},
      {entry: '.', name: 'removed', kind: 'value', exportedFrom: []},
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
      {entry: '.', name: 'demoted', kind: 'value', exportedFrom: ['./new'], typeOnly: true},
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
})

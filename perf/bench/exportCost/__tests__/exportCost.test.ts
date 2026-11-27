import * as fs from 'node:fs'
import * as os from 'node:os'
import path from 'node:path'

import {describe, expect, it} from 'vitest'

import {type ExportCost, entryForSpecifier} from '../analyze'
import {type CapturedModule, overrideModulePath} from '../cdnBuild'
import {BindingGraph} from '../graph'
import {cdnFileForPath} from '../moduleHost'
import {pickVerifications, runRange} from '../report'
import {type ByteSizes} from '../sizes'

function captured(id: string, code: string, resolved: Record<string, string>): CapturedModule {
  return {id, code, resolved, importedIds: [], dynamicallyImportedIds: []}
}

const bytes = (brotli: number): ByteSizes => ({raw: brotli, minified: brotli, gzip: brotli, brotli})

function cost(
  name: string,
  login: {exclusive: number; leavesBuild: number},
  options: {entry?: string; importedViaImportMap?: boolean} = {},
): ExportCost {
  return {
    entry: options.entry ?? 'index',
    name,
    tag: 'public',
    declaredIn: 'packages/sanity/src/core/index.ts',
    importedViaImportMap: options.importedViaImportMap ?? false,
    steps: {
      login: {
        exclusive: bytes(login.exclusive),
        exclusiveModules: 1,
        leavesBuild: bytes(login.leavesBuild),
        sharedMinified: 0,
        used: false,
      },
    },
  }
}

describe('BindingGraph', () => {
  it('follows every re-export of a namespace import and only the named binding', () => {
    const graph = new BindingGraph(
      new Map([
        ['heavy.js', captured('heavy.js', 'export const heavy = 1\n', {})],
        ['light.js', captured('light.js', 'export const light = 1\n', {})],
        [
          'barrel.js',
          captured(
            'barrel.js',
            "export {heavy} from './heavy.js'\nexport {light} from './light.js'\n",
            {'./heavy.js': 'heavy.js', './light.js': 'light.js'},
          ),
        ],
        [
          'namespace.js',
          captured('namespace.js', "import * as barrel from './barrel.js'\nvoid barrel\n", {
            './barrel.js': 'barrel.js',
          }),
        ],
        [
          'named.js',
          captured('named.js', "import {heavy} from './barrel.js'\nvoid heavy\n", {
            './barrel.js': 'barrel.js',
          }),
        ],
      ]),
    )

    expect([...graph.closure(graph.dependencies('namespace.js'))].toSorted()).toEqual([
      'barrel.js',
      'heavy.js',
      'light.js',
    ])
    expect([...graph.closure(graph.dependencies('named.js'))].toSorted()).toEqual(['heavy.js'])
  })
})

describe('cdnFileForPath', () => {
  it('maps module host URLs to CDN files', () => {
    expect(cdnFileForPath('/v1/modules/sanity/default/%5E7.0.0/t123')).toBe('index.mjs')
    expect(cdnFileForPath('/v1/modules/sanity/default/%5E7.0.0/t123/structure')).toBe(
      'structure.mjs',
    )
    expect(cdnFileForPath('/v1/modules/sanity/default/%5E7.0.0/t123/bundle.css')).toBe('bundle.css')
    expect(cdnFileForPath('/v1/modules/react/default/%5E19/t123')).toBeUndefined()
  })
})

describe('entryForSpecifier', () => {
  const entries = {index: 'index.mjs', structure: 'structure.mjs'}

  it('maps import-map specifiers to CDN entries', () => {
    expect(entryForSpecifier('sanity', entries)).toBe('index')
    expect(entryForSpecifier('sanity/structure', entries)).toBe('structure')
    expect(entryForSpecifier('sanity/unknown', entries)).toBeUndefined()
    expect(entryForSpecifier('react', entries)).toBeUndefined()
  })
})

describe('pickVerifications', () => {
  const costs = [
    cost('Big', {exclusive: 50_000, leavesBuild: 0}),
    cost('Leaves', {exclusive: 10_000, leavesBuild: 9_000}),
    cost('Small', {exclusive: 1_000, leavesBuild: 1_000}),
    cost('ByImportMap', {exclusive: 90_000, leavesBuild: 90_000}, {importedViaImportMap: true}),
    cost('Pane', {exclusive: 500, leavesBuild: 0}, {entry: 'structure'}),
  ]

  it('takes the top exports by both bounds, skipping those imported by specifier', () => {
    expect(pickVerifications(costs, 1, []).map((each) => each.name)).toEqual(['Big', 'Leaves'])
  })

  it('adds requested exports, defaulting to the index entry', () => {
    expect(
      pickVerifications(costs, 1, ['Small', 'structure:Pane']).map((each) => each.name),
    ).toEqual(['Big', 'Leaves', 'Small', 'Pane'])
  })

  it('rejects an unknown export', () => {
    expect(() => pickVerifications(costs, 1, ['structure:Missing'])).toThrow(/Missing/)
  })
})

describe('runRange', () => {
  const format = (value: number) => String(value)

  it('lists the lowest and highest run when the runs differ', () => {
    expect(runRange([3, 1, 2], format)).toBe('1 to 3')
  })

  it('stays empty for a single run or runs that agree', () => {
    expect(runRange(undefined, format)).toBe('')
    expect(runRange([4], format)).toBe('')
    expect(runRange([4, 4], format)).toBe('')
  })
})

describe('overrideModulePath', () => {
  it('creates the directory a nested entry name needs before the stand-in is written', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'export-cost-entry-'))
    try {
      const entry = '_dangerously_use_private_internals_that_do_not_follow_semver/structure'
      const file = overrideModulePath(dir, entry)
      fs.writeFileSync(file, 'export {}\n')
      expect(file).toBe(path.join(dir, `${entry}.ts`))
      expect(fs.readFileSync(file, 'utf8')).toBe('export {}\n')
    } finally {
      fs.rmSync(dir, {recursive: true, force: true})
    }
  })
})

/**
 * Plugins support Studio v6 (`main`) and v7 (`next-major`) with one version by importing from the
 * paths v7 uses, so `main` exports everything at the path v7 exports it from. The list of what
 * that is lives in `v7-export-map/v7-export-map.json`: generated here, copied to `main`
 * unchanged, where `test/v7-exports-on-v6.test.ts` (types) and `@repo/test-exports`'s
 * `test/v7-export-map.test.mjs` (runtime values) fail when anything in it is missing.
 *
 * The tests here catch both ways the two branches can drift apart:
 *
 * 1. An export moved or added on a v7 entry without regenerating the file.
 * 2. The file regenerated here, but `main`'s copy (and so `main`) lacking some of it. The test
 *    reads `origin/main`'s copy with git; CI fetches `main` for it. Until the file exists on
 *    `main` there is nothing to compare against, and the test is skipped.
 */
import {execFileSync} from 'node:child_process'

import {describe, expect, it} from 'vitest'

import {
  findMissingExports,
  readExportMap,
  V7_EXPORT_MAP_REPO_PATH,
} from '../v7-export-map/exportMap.mjs'
import v7ExportMap from '../v7-export-map/v7-export-map.json' with {type: 'json'}

const MAIN_REF = 'origin/main'

function git(...args: string[]): string {
  return execFileSync('git', args, {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']})
}

function succeeds(...args: string[]): boolean {
  try {
    git(...args)
    return true
  } catch {
    return false
  }
}

const hasMainRef = succeeds('rev-parse', '--verify', '--quiet', `${MAIN_REF}^{commit}`)
const mainHasExportMap =
  hasMainRef && succeeds('cat-file', '-e', `${MAIN_REF}:${V7_EXPORT_MAP_REPO_PATH}`)

describe('v7 export map', () => {
  // Walking every published entry's .d.ts with ts-morph takes longer than the default 5s.
  it('matches the export map of the built v7 entries', {timeout: 60_000}, () => {
    expect(
      readExportMap(),
      'A v7 entry exports something other than v7-export-map.json says. Regenerate it with ' +
        '`pnpm --filter @repo/test-dts-exports generate:v7-export-map` (after building), then ' +
        'add any new or moved export to the same entry on `main` (a re-export, never a copy of ' +
        'the module) and copy the regenerated file there.',
    ).toEqual(v7ExportMap)
  })

  it(`can be compared with ${MAIN_REF}`, () => {
    expect(
      hasMainRef,
      `${MAIN_REF} is missing, so the export map cannot be compared with main's copy. Run ` +
        '`git fetch origin main`.',
    ).toBe(true)
  })

  it.skipIf(!mainHasExportMap)(`has every entry and export on ${MAIN_REF}`, () => {
    const mainExportMap = JSON.parse(git('show', `${MAIN_REF}:${V7_EXPORT_MAP_REPO_PATH}`))
    expect(
      findMissingExports(v7ExportMap, mainExportMap),
      `${MAIN_REF}'s copy of v7-export-map.json lacks these v7 exports, so main may not export ` +
        'them at the v7 path. Add them to the same entry on `main` (a re-export, never a copy ' +
        'of the module) and copy this branch’s v7-export-map.json there.',
    ).toEqual([])
  })
})

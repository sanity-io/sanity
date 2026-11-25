import {mkdtempSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import browserslist from 'browserslist'
import {browserslistToTargets} from 'lightningcss'
import {describe, expect, it} from 'vitest'

import {
  lightningCssTargets,
  readPackageBrowserslist,
  resolveBrowsers,
  viteBuildTarget,
} from './index'

const sanityDir = fileURLToPath(new URL('../../../sanity', import.meta.url))

function packageDir(manifest: object): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'browser-targets-'))
  writeFileSync(path.join(dir, 'package.json'), JSON.stringify(manifest))
  return dir
}

describe('readPackageBrowserslist()', () => {
  it('reads the browserslist field of the sanity package', () => {
    expect(readPackageBrowserslist(sanityDir)).toEqual([
      'node >=24.11',
      'baseline 2026 with downstream',
    ])
  })

  it('throws for a package without a browserslist field', () => {
    expect(() => readPackageBrowserslist(packageDir({name: 'no-browsers'}))).toThrow(
      /declares no `browserslist` field/,
    )
  })
})

describe('resolveBrowsers()', () => {
  it('resolves the browsers of the queries, without Node.js', () => {
    const browsers = resolveBrowsers(['node >=24.11', 'baseline 2026 with downstream'])
    expect(browsers).toEqual(browserslist('baseline 2026 with downstream'))
    expect(browsers.some((browser) => browser.startsWith('node '))).toBe(false)
  })
})

describe('lightningCssTargets()', () => {
  it('converts the browsers to Lightning CSS targets', () => {
    expect(lightningCssTargets(['node >=24.11', 'baseline 2026 with downstream'])).toEqual(
      browserslistToTargets(browserslist('baseline 2026 with downstream')),
    )
  })
})

describe('viteBuildTarget()', () => {
  it('lists the lowest version of every engine Vite understands', () => {
    expect(
      viteBuildTarget([
        'chrome 130',
        'chrome 125',
        'edge 118',
        'samsung 25',
        'firefox 121',
        'ios_saf 16.4-16.7',
        'ios_saf 17.0',
        'safari 16.4',
      ]).toSorted(),
    ).toEqual(['chrome125', 'edge118', 'firefox121', 'ios16.4', 'safari16.4'])
  })

  it('never lowers further than the Vite default (Baseline Widely available)', () => {
    // `baseline-widely-available` in Vite 8: what the bundles were built for before
    const widelyAvailable: Record<string, number> = {
      chrome: 111,
      edge: 111,
      firefox: 114,
      safari: 16.4,
      ios: 16.4,
    }
    const target = viteBuildTarget(readPackageBrowserslist(sanityDir))
    for (const [engine, version] of Object.entries(widelyAvailable)) {
      const entry = target.find((value) => value.replace(/[\d.]+$/, '') === engine)
      expect(entry, engine).toBeDefined()
      expect(Number.parseFloat(entry!.slice(engine.length)), engine).toBeGreaterThanOrEqual(version)
    }
  })
})

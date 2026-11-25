import {readFileSync} from 'node:fs'
import path from 'node:path'

import browserslist from 'browserslist'
import {browserslistToTargets, type Targets} from 'lightningcss'

/** A `browserslist` field of a package.json: one query, or a list of them. */
export type BrowserslistQueries = string | readonly string[]

/**
 * The `browserslist` field of the package.json in `dir`. Throws when the package declares none,
 * rather than letting the build fall back to some other default.
 */
export function readPackageBrowserslist(dir: string): BrowserslistQueries {
  const manifestPath = path.join(dir, 'package.json')
  const {browserslist: queries} = JSON.parse(readFileSync(manifestPath, 'utf8'))
  if (typeof queries !== 'string' && !Array.isArray(queries)) {
    throw new Error(`${manifestPath} declares no \`browserslist\` field`)
  }
  return queries
}

/**
 * The browsers that the queries resolve to, without the Node.js entries (`"node >=24.11"`) that
 * the published packages also list.
 */
export function resolveBrowsers(queries: BrowserslistQueries): string[] {
  return browserslist([queries].flat()).filter((browser) => !browser.startsWith('node '))
}

/**
 * Lightning CSS `targets` for the queries, for the `lightningcss` options of tsdown's CSS and
 * Panda CSS pipelines.
 */
export function lightningCssTargets(queries: BrowserslistQueries): Targets {
  return browserslistToTargets(resolveBrowsers(queries))
}

// Vite's `build.target` only understands these engines (`convertTargets` throws on others), so
// each browserslist name maps onto the engine it ships. The names left out (`samsung`, for one)
// are Chromium based, and listed at versions with the same Baseline support as `chrome`
const VITE_ENGINES: Record<string, string> = {
  chrome: 'chrome',
  and_chr: 'chrome',
  android: 'chrome',
  edge: 'edge',
  firefox: 'firefox',
  and_ff: 'firefox',
  safari: 'safari',
  ios_saf: 'ios',
  opera: 'opera',
}

/**
 * Vite `build.target` (and so `build.cssTarget`) for the queries: the lowest version of every
 * engine they resolve to, e.g. `['chrome153', 'edge153', 'firefox159', …]`.
 */
export function viteBuildTarget(queries: BrowserslistQueries): string[] {
  const lowest = new Map<string, string>()
  for (const entry of resolveBrowsers(queries)) {
    const [name, versionRange] = entry.split(' ')
    const engine = VITE_ENGINES[name]
    if (!engine || !versionRange) continue
    // `ios_saf 15.2-15.3`: a range covers versions with the same support, so its start is enough
    const [version] = versionRange.split('-')
    const current = lowest.get(engine)
    if (current === undefined || compareVersions(version, current) < 0) {
      lowest.set(engine, version)
    }
  }
  return [...lowest].map(([engine, version]) => `${engine}${version}`)
}

function compareVersions(a: string, b: string): number {
  const left = a.split('.').map(Number)
  const right = b.split('.').map(Number)
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const difference = (left[i] ?? 0) - (right[i] ?? 0)
    if (difference !== 0) return difference
  }
  return 0
}

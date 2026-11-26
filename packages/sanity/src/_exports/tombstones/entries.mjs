import {readFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

export const PACKAGE_DIR = join(here, '../../..')

export const BEGIN = '// <tombstones>'
export const END = '// </tombstones>'

/** @typedef {{name: string, kind: 'value' | 'type', message: string}} Tombstone */
/** @typedef {{removedEntries: string[], tombstones: Record<string, Tombstone[]>}} Manifest */

/** @returns {Manifest} */
export function readManifest() {
  return JSON.parse(readFileSync(join(here, 'manifest.json'), 'utf8'))
}

/**
 * The barrel source and the built `.d.ts` of every entry the manifest has tombstones for, from
 * the package's `exports` map.
 *
 * @returns {{entry: string, source: string, dts: string, tombstones: Tombstone[]}[]}
 */
export function listTombstoneTargets() {
  const {exports} = JSON.parse(readFileSync(join(PACKAGE_DIR, 'package.json'), 'utf8'))
  const manifest = readManifest()
  return Object.entries(manifest.tombstones).map(([entry, tombstones]) => {
    const target = exports[entry]
    if (!target?.monorepo || !target.default) {
      throw new Error(
        `tombstones/manifest.json lists "${entry}", which package.json does not export`,
      )
    }
    return {
      entry,
      source: join(PACKAGE_DIR, target.monorepo),
      dts: join(PACKAGE_DIR, target.default.replace(/\.(m|c)?js$/, '.d.ts')),
      tombstones,
    }
  })
}

/**
 * Every import a plugin can write against Studio v7 must also work against v6, so one plugin
 * version can support both majors. `v7-export-map.json` is generated on `next-major` and copied
 * here verbatim; see `v7-export-map/exportMap.mjs` for how the two branches keep it in sync.
 * `@repo/test-exports` checks the same map against the runtime exports.
 */
import {expect, test} from 'vitest'

import {
  findMissingExports,
  readExportMap,
  V7_EXPORT_MAP_PATH,
  V7_EXPORT_MAP_REPO_PATH,
} from '../v7-export-map/exportMap.mjs'
import v7ExportMap from '../v7-export-map/v7-export-map.json' with {type: 'json'}

test(
  'every export of a v7 entry is exported from the same entry on v6',
  // Walking every published entry's .d.ts with ts-morph takes longer than the default 5s.
  {timeout: 60_000},
  () => {
    expect(V7_EXPORT_MAP_PATH.endsWith('v7-export-map.json')).toBe(true)
    expect(V7_EXPORT_MAP_REPO_PATH).toBe(
      'packages/@repo/test-dts-exports/v7-export-map/v7-export-map.json',
    )
    expect(
      findMissingExports(v7ExportMap, readExportMap()),
      'Studio v7 exports these from an entry that does not export them on v6. Backport them: ' +
        're-export the same implementation from the same entry on main ' +
        '(packages/sanity/src/_exports/*.ts, and package.json `exports` plus package.bundle.ts ' +
        `for a new entry), keeping the existing v6 paths. Then copy ${V7_EXPORT_MAP_REPO_PATH}.`,
    ).toEqual([])
  },
)

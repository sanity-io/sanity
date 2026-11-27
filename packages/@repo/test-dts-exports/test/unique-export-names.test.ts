/**
 * Every export name comes from exactly one `sanity/package.json#exports` entry. v6 let a moved
 * export live at its old and new path so plugins could target both majors; v7 is the cleanup.
 * A `never` tombstone is not an export (type-only, no runtime binding, there to name the one
 * entry that owns the name), so it does not count against the name.
 */
import {describe, expect, it} from 'vitest'

import {entryImportPath, readSurface, WORKSPACE_PACKAGE_DIR} from '../tombstones/surface.mjs'

describe('sanity export names', () => {
  it('are exported from exactly one entry, tombstones aside', {timeout: 60_000}, () => {
    const entriesByName = new Map<string, string[]>()
    for (const [entry, names] of Object.entries(readSurface(WORKSPACE_PACKAGE_DIR))) {
      for (const [name, info] of Object.entries(names)) {
        if (info.tombstone) continue
        entriesByName.set(name, [...(entriesByName.get(name) ?? []), entryImportPath(entry)])
      }
    }

    const duplicates = [...entriesByName]
      .filter(([, entries]) => entries.length > 1)
      .toSorted(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([name, entries]) => `${name}: ${entries.join(', ')}`)

    expect(
      duplicates,
      'Keep each of these names at one entry and remove it from the others. Where the old ' +
        'path existed in `sanity@latest`, add a tombstone for it to ' +
        '`packages/sanity/src/_exports/tombstones/manifest.json` that names the entry that ' +
        'keeps it, then run `node packages/sanity/src/_exports/tombstones/generate.mjs`.',
    ).toEqual([])
  })
})

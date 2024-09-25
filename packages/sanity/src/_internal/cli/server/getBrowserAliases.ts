import path from 'node:path'

import {escapeRegExp} from 'lodash'
import resolve from 'resolve.exports'
import {type Alias} from 'vite'

/**
 * The following are the specifiers that are expected/allowed to be used within
 * a built Sanity studio in the browser. These are used in combination with
 * `resolve.exports` to determine the final entry point locations for each allowed specifier.
 *
 * There is also a corresponding test for this file that expects these to be
 * included in the `sanity` package.json. That test is meant to keep this list
 * in sync in the event we add another package subpath.
 *
 * @internal
 */
export const browserCompatibleSanityPackageSpecifiers = [
  'sanity',
  'sanity/_createContext',
  'sanity/_singletons',
  'sanity/desk',
  'sanity/presentation',
  'sanity/router',
  'sanity/structure',
  'sanity/package.json',
]

/**
 * These conditions should align with the conditions present in the
 * `package.json` of the `'sanity'` module. they are given to `resolve.exports`
 * in order to determine the correct entrypoint for the browser-compatible
 * package specifiers listed above.
 */
const conditions = ['import', 'browser', 'default']

// locate the entry points for each subpath the Sanity module exports
export function getSanityPkgExportAliases(sanityPkgPath: string) {
  // Load the package.json of the Sanity package
  // eslint-disable-next-line import/no-dynamic-require
  const pkg = require(sanityPkgPath)
  const dirname = path.dirname(sanityPkgPath)

  // Resolve the entry points for each allowed specifier
  const unifiedSanityAliases = browserCompatibleSanityPackageSpecifiers.reduce<Alias[]>(
    (acc, next) => {
      // Resolve the export path for the specifier using resolve.exports
      const dest = resolve.exports(pkg, next, {browser: true, conditions})?.[0]
      if (!dest) return acc

      // Map the specifier to its resolved path
      acc.push({
        find: new RegExp(`^${escapeRegExp(next)}$`),
        replacement: path.resolve(dirname, dest),
      })
      return acc
    },
    [],
  )

  // Return the aliases configuration for external projects
  return unifiedSanityAliases
}

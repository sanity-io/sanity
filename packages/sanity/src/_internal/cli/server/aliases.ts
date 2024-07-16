import path from 'node:path'

import {escapeRegExp} from 'lodash'
import resolve from 'resolve.exports'
import {type Alias, type AliasOptions} from 'vite'

import {type SanityMonorepo} from './sanityMonorepo'

/**
 * @internal
 */
export interface GetAliasesOptions {
  /** An optional monorepo configuration object. */
  monorepo?: SanityMonorepo
  /** The path to the sanity package.json file. */
  sanityPkgPath?: string
  /** The list of conditions to resolve package exports. */
  conditions?: string[]
}

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
 * Returns an object of aliases for Vite to use.
 *
 * This function is used within our build tooling to prevent multiple context errors
 * due to multiple instances of our library. It resolves the appropriate paths for
 * modules based on whether the current project is inside the Sanity monorepo or not.
 *
 * If the project is within the monorepo, it uses the source files directly for a better
 * development experience. Otherwise, it uses the `sanityPkgPath` and `conditions` to locate
 * the entry points for each subpath the Sanity module exports.
 *
 * @internal
 */
export function getAliases({monorepo, sanityPkgPath, conditions}: GetAliasesOptions): AliasOptions {
  // If the current Studio is located within the Sanity monorepo
  if (monorepo?.path) {
    // Load monorepo aliases. This ensures that the Vite server uses the source files
    // instead of the compiled output, allowing for a better development experience.
    const aliasesPath = path.resolve(monorepo.path, 'dev/aliases.cjs')

    // Import the development aliases configuration
    // eslint-disable-next-line import/no-dynamic-require
    const devAliases: Record<string, string> = require(aliasesPath)

    // Resolve each alias path relative to the monorepo path
    const monorepoAliases = Object.fromEntries(
      Object.entries(devAliases).map(([key, modulePath]) => {
        return [key, path.resolve(monorepo.path, modulePath)]
      }),
    )

    // Return the aliases configuration for monorepo
    return monorepoAliases
  }

  // If not in the monorepo, use the `sanityPkgPath` and `conditions`
  // to locate the entry points for each subpath the Sanity module exports
  if (sanityPkgPath && conditions) {
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

  // Return an empty aliases configuration if no conditions are met
  return {}
}

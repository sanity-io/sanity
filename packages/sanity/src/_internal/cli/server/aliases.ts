import path from 'node:path'

import {escapeRegExp} from 'lodash'
import resolve from 'resolve.exports'
import resolveFrom from 'resolve-from'
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
 * These conditions should align with the conditions present in the
 * `package.json` of the `'sanity'` module. they are given to `resolve.exports`
 * in order to determine the correct entrypoint for the browser-compatible
 * package specifiers listed above.
 */
const conditions = ['import', 'browser', 'default']

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
export function getAliases({monorepo, sanityPkgPath}: GetAliasesOptions): AliasOptions {
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

    // first get the path of `style-components`'s package.json
    const styledComponentsPkgPath = resolveFrom(monorepo.path, 'styled-components/package.json')
    // then load it
    // eslint-disable-next-line import/no-dynamic-require
    const styledComponentsPkg = require(styledComponentsPkgPath)
    // get the dirname from the package path
    const styledComponentsRoot = path.dirname(styledComponentsPkgPath)
    // then augment the package dirname to the `module` entry point.
    const styledComponentsEntryPoint = path.join(styledComponentsRoot, styledComponentsPkg.module)

    // Return the aliases configuration for monorepo
    return {
      ...monorepoAliases,
      'styled-components/package.json': styledComponentsPkgPath,
      'styled-components': styledComponentsEntryPoint,
    }
  }

  // If not in the monorepo, use the `sanityPkgPath`
  // to locate the entry points for each subpath the Sanity module exports
  if (sanityPkgPath) {
    // Load the package.json of the Sanity package
    // eslint-disable-next-line import/no-dynamic-require
    const pkg = require(sanityPkgPath)
    const dirname = path.dirname(sanityPkgPath)

    // Resolve the entry points for each allowed specifier
    const aliases: Alias[] = []

    for (const specifier of browserCompatibleSanityPackageSpecifiers) {
      // Resolve the export path for the specifier using resolve.exports
      const dest = resolve.exports(pkg, specifier, {browser: true, conditions})?.[0]
      if (!dest) continue

      // Map the specifier to its resolved path
      aliases.push({
        find: new RegExp(`^${escapeRegExp(specifier)}$`),
        replacement: path.resolve(dirname, dest),
      })
    }

    // resolve styled-components package.json location relative to the sanity
    // package.json parent folder
    const styledComponentsPkgPath = resolveFrom(
      path.dirname(sanityPkgPath),
      'styled-components/package.json',
    )
    aliases.push({
      find: /^styled-components\/package\.json$/,
      replacement: styledComponentsPkgPath,
    })

    // then load the styled-components package.json
    // eslint-disable-next-line import/no-dynamic-require
    const styledComponentsPkg = require(styledComponentsPkgPath)
    // get the styled-components package root
    const styledComponentsRoot = path.dirname(styledComponentsPkgPath)

    // and then alias `styled-components` exactly to the result of the `module`
    // entry point
    aliases.push({
      find: /^styled-components$/,
      replacement: path.resolve(styledComponentsRoot, styledComponentsPkg.module),
    })

    // Return the aliases configuration for external projects
    return aliases
  }

  // Return an empty aliases configuration if no conditions are met
  return {}
}

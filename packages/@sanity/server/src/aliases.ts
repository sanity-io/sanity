import path from 'path'
import type {SanityMonorepo} from './sanityMonorepo'

/**
 * Returns an object of aliases for vite to use
 *
 * @internal
 */
export function getAliases(opts: {monorepo?: SanityMonorepo}): Record<string, string> {
  const {monorepo} = opts

  if (!monorepo?.path) {
    return {}
  }

  // Load monorepo aliases (if the current Studio is located within the sanity monorepo)
  // This is done in order for the Vite server to use the source files instead of
  // the compiled output, allowing for a better dev experience.
  const aliasesPath = path.resolve(monorepo.path, 'dev/aliases.cjs')

  // eslint-disable-next-line import/no-dynamic-require
  const devAliases: Record<string, string> = require(aliasesPath)

  const monorepoAliases = Object.fromEntries(
    Object.entries(devAliases).map(([key, modulePath]) => {
      return [key, path.resolve(monorepo.path, modulePath)]
    })
  )

  return monorepoAliases
}

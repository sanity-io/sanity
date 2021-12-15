import path from 'path'

/**
 * Returns an object of aliases for vite to use
 *
 * @internal
 */
export function getAliases(opts: {isMonorepo: boolean}): Record<string, string> {
  const {isMonorepo} = opts

  if (!isMonorepo) {
    return {}
  }

  // Load monorepo aliases (if the current Studio is located within the sanity monorepo)
  const devAliases: Record<string, string> = require('../../../../dev/aliases')
  const monorepoAliases = Object.fromEntries(
    Object.entries(devAliases).map(([key, modulePath]) => {
      return [key, path.resolve(__dirname, '../../../..', modulePath)]
    })
  )

  return monorepoAliases
}

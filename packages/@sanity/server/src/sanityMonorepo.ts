import path from 'path'
import readPkgUp from 'read-pkg-up'

/**
 * @internal
 */
export interface SanityMonorepo {
  path: string
}

/**
 * Load information about the `sanity-io/sanity` monorepo (if applicable)
 *
 * @internal
 */
export async function loadSanityMonorepo(cwd: string): Promise<SanityMonorepo | undefined> {
  let p = cwd

  while (p !== '/') {
    const readResult = await readPkgUp({cwd: p})

    if (!readResult) {
      return undefined
    }

    if (readResult.packageJson.isSanityMonorepo) {
      return {path: path.dirname(readResult.path)}
    }

    p = path.dirname(path.dirname(readResult.path))
  }

  return undefined
}

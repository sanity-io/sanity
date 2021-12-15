import path from 'path'
import {promises as fs} from 'fs'

/**
 * Resolves the path to the studio configuration file, prefering
 * `sanity.config.js`, but allowing `sanity.config.ts`. Falls back to the
 * default studio configuration exported by `@sanity/base`
 *
 * @internal
 */
export async function getSanityStudioConfigPath(studioRootPath: string): Promise<string | null> {
  const jsConfigPath = path.join(studioRootPath, 'sanity.config.js')
  const tsConfigPath = path.join(studioRootPath, 'sanity.config.ts')

  const [js, ts] = await Promise.all([fileExists(jsConfigPath), fileExists(tsConfigPath)])

  if (!js && !ts) {
    return path.join(__dirname, 'defaultStudioConfig')
  }

  if (!js && ts) {
    return tsConfigPath
  }

  if (js && ts) {
    console.warn('Found both `sanity.config.js` and `sanity.config.ts` - using sanity.config.js')
  }

  return jsConfigPath
}

/**
 * Asynchronously checks if a file exists. This is prone to race conditions,
 * as the file can exist/not exist by the time this resolves, but in this
 * case this is an acceptable trade-off. Best effort, and all that.
 */
function fileExists(filePath: string): Promise<boolean> {
  return fs.stat(filePath).then(
    () => true,
    () => false
  )
}

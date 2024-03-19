import createDebug from 'debug'
import {createMatchPath, loadConfig as loadTSConfig} from 'tsconfig-paths'

const debug = createDebug('sanity:codegen:moduleResolver')

/**
 * This is a custom implementation of require.resolve that takes into account the paths
 * configuration in tsconfig.json. This is necessary if we want to resolve paths that are
 * custom defined in the tsconfig.json file.
 * Resolving here is best effort and might not work in all cases.
 * @beta
 */
export function getResolver(cwd?: string): NodeJS.RequireResolve {
  const tsConfig = loadTSConfig(cwd)

  if (tsConfig.resultType === 'failed') {
    debug('Could not load tsconfig, using default resolver: %s', tsConfig.message)
    return require.resolve
  }

  const matchPath = createMatchPath(
    tsConfig.absoluteBaseUrl,
    tsConfig.paths,
    tsConfig.mainFields,
    tsConfig.addMatchAll,
  )

  const resolve = function (request: string, options?: {paths?: string[]}): string {
    const found = matchPath(request)
    if (found !== undefined) {
      return require.resolve(found, options)
    }
    return require.resolve(request, options)
  }

  // wrap the resolve.path function to make it available.
  resolve.paths = (request: string): string[] | null => {
    return require.resolve.paths(request)
  }
  return resolve
}

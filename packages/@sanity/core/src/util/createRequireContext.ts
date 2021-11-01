import path from 'path'
import klaw from 'klaw-sync'

/**
 * https://webpack.js.org/guides/dependency-management/#requirecontext
 */
interface WebpackRequireContextFactory {
  (
    directory: string,
    useSubdirectories?: boolean,
    regExp?: RegExp,
    mode?: 'sync'
  ): WebpackRequireContext
}

/**
 * https://webpack.js.org/guides/dependency-management/#context-module-api
 */
interface WebpackRequireContext {
  (request: string): unknown

  id: string
  keys(): string[]
  resolve(request: string): unknown
}

/**
 * note, options are primarily for testing
 */
interface CreateRequireContextOptions {
  require?: (request: string) => unknown
  resolve?: (request: string) => string
}

const globalRequire = require

export function createRequireContext(
  dirname: string,
  {
    require = globalRequire,
    resolve = globalRequire.resolve.bind(globalRequire),
  }: CreateRequireContextOptions = {}
): WebpackRequireContextFactory {
  function requireContext(
    directory: string,
    recursive = true,
    regExp = /.*/
  ): WebpackRequireContext {
    console.warn('Usage of `require.context` is deprecated and will break in a future release.')

    try {
      const basedir = path.resolve(dirname, directory)

      const keys = klaw(basedir, {
        depthLimit: recursive ? 30 : 0,
      })
        .filter((item) => !item.stats.isDirectory() && regExp.test(item.path))
        // use relative paths for the keys
        .map((item) => path.relative(basedir, item.path))
        // if the path.resolve doesn't prefixed with `./` then add it.
        // note it could be upward `../` so we need the conditional
        .map((filename) => (filename.startsWith('.') ? filename : `./${filename}`))

      // eslint-disable-next-line no-inner-declarations
      function context(request: string) {
        // eslint-disable-next-line import/no-dynamic-require
        return require(path.join(basedir, request))
      }

      Object.defineProperty(context, 'id', {
        get: () => {
          console.warn('`require.context` `context.id` is not supported.')
          return ''
        },
      })

      Object.defineProperty(context, 'keys', {
        // NOTE: this keys method does not match the behavior of webpack's
        // require.context context because it does not return all possible keys
        //
        // e.g. `./module-a/index.js`
        // would return `['./module-a', './module-a/index', './module-a/index.js']`
        value: () => keys,
      })

      Object.defineProperty(context, 'resolve', {
        value: (request: string) => resolve(path.join(basedir, request)),
      })

      return context as WebpackRequireContext
    } catch (contextErr) {
      contextErr.message = `Error running require.context():\n\n${contextErr.message}`
      throw contextErr
    }
  }

  return requireContext
}

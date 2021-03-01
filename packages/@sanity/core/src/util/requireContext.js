/* eslint-disable import/no-dynamic-require, max-depth, no-inner-declarations */

/**
 * This file exposes a "register" function which hacks in a `require.context` function,
 * mirroring webpacks version (https://webpack.js.org/guides/dependency-management/#requirecontext)
 *
 * Basically allows you to do `require.context('./types', true, /\.js$/)` to import multiple
 * files at the same time. While generally not advised (given it's a webpack-only thing),
 * people are already using it in the wild, so it breaks when trying to deploy GraphQL APIs,
 * or when running scripts using `sanity exec`.
 *
 * We have to inject the `require.context` function to each required file, which is done by
 * overriding the `module.constructor.wrap` method, with a stringified version of `requireContext`
 * injected to the top of the file, assigned to `require.context`.
 *
 * To make things worse, knowing where the require call was performed from is harder than it
 * ought to be, so we have to use an approach where we get the calling path name from an
 * error stacktrace. This is required to resolve `./types` to `/some/studio/path/schemas/types`,
 * for instance.
 */

const klawPath = require.resolve('klaw-sync')
const resolvePath = require.resolve('resolve-from')
const hookPath = __dirname

let registered = false

const requireContext = (directory, recursive, regExp) => {
  // This whole thing is kind of sketchy, so let's wrap it to prevent any breakage
  // if node should change it's APIs in any way
  try {
    // Has to be required from within function because of wrapping
    const path = require('path')
    const klaw = require(klawPath)
    const resolveFrom = require(resolvePath)

    // We need to resolve `./foo` from where the _caller_ is situated
    function getCallerDirName() {
      const originalFunc = Error.prepareStackTrace

      let callerFile
      let currentFile
      try {
        const err = new Error()

        Error.prepareStackTrace = function prepareStackTrace(error, stack) {
          return stack
        }

        currentFile = err.stack.shift().getFileName()
        if (currentFile === hookPath) {
          while (err.stack.length) {
            callerFile = err.stack.shift().getFileName()

            if (currentFile !== callerFile) {
              break
            }
          }
        } else {
          callerFile = currentFile
        }
      } catch (err) {
        // noop
      }

      Error.prepareStackTrace = originalFunc

      return path.dirname(callerFile)
    }

    // Assume absolute path by default
    let basePath = directory

    if (directory[0] === '.') {
      // Relative path
      basePath = path.join(getCallerDirName(), directory)
    } else if (!path.isAbsolute(directory)) {
      // Module path, resolve the module from the caller
      basePath = resolveFrom(getCallerDirName(), directory)
    }

    // Fix any trailing slashes and similar
    basePath = path.resolve(basePath)

    const keys = klaw(basePath, {depthLimit: recursive ? 30 : 0, nodir: false})
      // Make sure we only match the provided regexp (or use the default (.json/.js))
      .filter((file) => file.path.match(regExp || /\.(json|js)$/))
      // Use relative paths for the keys
      .map((file) => path.join('.', file.path.slice(basePath.length + 1)))

    const context = (key) => require(context.resolve(key))
    context.resolve = (key) => path.resolve(basePath, key)
    context.keys = () => keys

    return context
  } catch (contextErr) {
    contextErr.message = `Error running require.context():\n\n${contextErr.message}`
    throw contextErr
  }
}

const wrap = module.constructor.wrap
const restore = () => {
  module.constructor.wrap = wrap
}

function register() {
  if (registered) {
    return restore
  }

  try {
    module.constructor.wrap = (script) => {
      const requireContextScript = requireContext
        .toString()
        .replace(/hookPath/g, JSON.stringify(hookPath))
        .replace(/klawPath/g, JSON.stringify(klawPath))
        .replace(/resolvePath/g, JSON.stringify(resolvePath))

      // Assigning the function may very well crash in an upcoming version,
      // so try to catch and warn if this is the case
      return wrap(`try {
        require.context = ${requireContextScript}
      } catch (err) {
        console.warn('Error assigning require.context function:\\n' + err.message)
      }\n\n${script}`)
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`Error assigning module wrapper for require.context hook:\n${err.message}`)
  }

  registered = true

  // There isn't a good way to clean this up
  return restore
}

module.exports = {
  register,
}

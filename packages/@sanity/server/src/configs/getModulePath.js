import path from 'path'
import Module from 'module'
import readPkgUp from 'read-pkg-up'

/**
 * Given a target module, returns the absolute path of the module using
 * `require.resolve` with a custom [`paths` option][link] that considers
 * monorepo setups with workspaces
 *
 * [link]: https://nodejs.org/api/modules.html#requireresolverequest-options
 *
 * @param {string} targetModule
 * @returns {string} the absolute resolved path of the target module
 */
export function getModulePath(targetModule) {
  let cwdPaths

  try {
    // this fixes an issue where modules in monorepos with workspaces would
    // fail to resolve modules from inside a particular workspace.
    //
    // this would occur if the root-level `node_modules` contained the
    // `@sanity/server` package and ran `require.resolve` from that context.
    // this would cause dependencies that were only located in package-level
    // workspaces (e.g. `/packages/studio`) to be omitted from the
    // `require.resolve` search causing errors like `Error: Cannot find module
    // 'styled-components'`
    //
    // calling `Module._nodeModulePaths` with the current working directory
    // returns an array of paths that does consider the workspace
    //
    // note: wrapped in a try-catch due to the usage of a Node.js internal API
    // https://github.com/nodejs/node/blob/cf6996458b82ec0bdf97209bce380e1483c349fb/lib/internal/modules/cjs/loader.js#L583
    cwdPaths = Module._nodeModulePaths(process.cwd())
  } catch {
    cwdPaths = []
  }

  const modulePath = require.resolve(targetModule, {
    paths: [...module.paths, ...cwdPaths],
  })
  const pkg = readPkgUp.sync({cwd: path.dirname(modulePath)})
  return pkg ? path.dirname(pkg.path) : modulePath
}

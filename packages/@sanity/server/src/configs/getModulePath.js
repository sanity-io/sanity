import path from 'path'
import readPkgUp from 'read-pkg-up'

export function getModulePath(mod) {
  const modulePath = require.resolve(mod)
  const pkg = readPkgUp.sync({cwd: path.dirname(modulePath)})
  return pkg ? path.dirname(pkg.path) : modulePath
}

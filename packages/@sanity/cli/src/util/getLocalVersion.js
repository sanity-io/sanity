import path from 'path'
import resolveFrom from 'resolve-from'
import dynamicRequire from './dynamicRequire'

export default (moduleId, workDir) => {
  const fromPath = workDir || process.cwd()
  const modulePath = resolveFrom.silent(fromPath, path.join(moduleId, 'package.json'))
  return modulePath && dynamicRequire(modulePath).version
}

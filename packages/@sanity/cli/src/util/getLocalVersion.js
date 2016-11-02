import path from 'path'
import resolveFrom from 'resolve-from'

export default (moduleId, workDir) => {
  const fromPath = workDir || process.cwd()
  const modulePath = resolveFrom(fromPath, path.join(moduleId, 'package.json'))
  return modulePath && require(modulePath).version
}

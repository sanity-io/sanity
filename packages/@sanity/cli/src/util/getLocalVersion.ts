import path from 'path'
import resolveFrom from 'resolve-from'
import {dynamicRequire} from './dynamicRequire'

export function getLocalVersion(moduleId: string, workDir: string): string | undefined {
  const fromPath = workDir || process.cwd()
  const modulePath = resolveFrom.silent(fromPath, path.join(moduleId, 'package.json'))
  if (modulePath) {
    return tryGetVersion(modulePath)
  }

  // In the case of packages with an `exports` key, we may not be able to resolve `package.json`.
  // If this happens, try to resolve the module itself and look for the last occurence of the
  // package name, then append `package.json` to that path
  const pathSegment = path.normalize(moduleId)
  const parentPath = resolveFrom.silent(fromPath, moduleId)
  if (!parentPath) {
    return undefined
  }

  const moduleRoot = parentPath.slice(0, parentPath.lastIndexOf(pathSegment) + pathSegment.length)
  const manifestPath = path.join(moduleRoot, 'package.json')
  return tryGetVersion(manifestPath)
}

function tryGetVersion(modulePath: string): string | undefined {
  try {
    return dynamicRequire(modulePath).version
  } catch (err) {
    return undefined
  }
}

import {readFileSync} from 'node:fs'
import {join as joinPath, normalize as normalizePath} from 'node:path'

import resolveFrom from 'resolve-from'

export function getLocalVersion(moduleId: string, workDir: string): string | undefined {
  const fromPath = workDir || process.cwd()
  const modulePath = resolveFrom.silent(fromPath, joinPath(moduleId, 'package.json'))
  if (modulePath) {
    return tryGetVersion(modulePath)
  }

  // In the case of packages with an `exports` key, we may not be able to resolve `package.json`.
  // If this happens, try to resolve the module itself and look for the last occurence of the
  // package name, then append `package.json` to that path
  const pathSegment = normalizePath(moduleId)
  const parentPath = resolveFrom.silent(fromPath, moduleId)
  if (!parentPath) {
    return undefined
  }

  const moduleRoot = parentPath.slice(0, parentPath.lastIndexOf(pathSegment) + pathSegment.length)
  const manifestPath = joinPath(moduleRoot, 'package.json')
  return tryGetVersion(manifestPath)
}

function tryGetVersion(modulePath: string): string | undefined {
  try {
    const fileContent = readFileSync(modulePath, 'utf8')
    const manifest = JSON.parse(fileContent)
    return manifest.version
  } catch (err) {
    return undefined
  }
}

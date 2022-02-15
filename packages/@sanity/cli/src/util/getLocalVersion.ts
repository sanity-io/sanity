import path from 'path'
import resolveFrom from 'resolve-from'
import {dynamicRequire} from './dynamicRequire'

export function getLocalVersion(moduleId: string, workDir: string): string | undefined {
  const fromPath = workDir || process.cwd()
  const modulePath = resolveFrom.silent(fromPath, path.join(moduleId, 'package.json'))
  return modulePath && dynamicRequire(modulePath).version
}

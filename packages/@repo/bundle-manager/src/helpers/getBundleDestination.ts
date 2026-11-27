import path from 'node:path'

import {appVersion} from '../constants'
import {cleanDirName} from '../utils'

/**
 * The bucket object a file of a package's `dist` directory is uploaded to. The module server
 * redirects `<package>/<subpath>` to `bare/<subpath>.mjs`, and nested entries (`<dir>/<name>.mjs`)
 * import their chunks relative to their own directory, so the path below `dist` is kept as-is.
 */
export function getBundleDestination(options: {
  pkg: string
  version: string
  distDir: string
  filePath: string
}): string {
  const {pkg, version, distDir, filePath} = options
  const relativePath = path.relative(distDir, filePath)
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    throw new Error(`${filePath} is not inside ${distDir}`)
  }
  const fileName = relativePath.split(path.sep).join('/')
  return `modules/${appVersion}/${cleanDirName(pkg)}/${version}/bare/${fileName}`
}

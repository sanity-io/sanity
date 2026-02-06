import fs from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {getPackagePaths} from './getPackagePaths'
import {type PackageInfo} from './types'

const rootPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

export function readPackages(): PackageInfo[] {
  return getPackagePaths().map((file) => {
    const filePath = path.join(rootPath, file)
    const dirname = path.join(rootPath, path.dirname(file))
    return {
      path: filePath,
      dirname: dirname,
      relativeDir: path.relative(rootPath, dirname),
      contents: JSON.parse(fs.readFileSync(filePath, 'utf8')),
    }
  })
}

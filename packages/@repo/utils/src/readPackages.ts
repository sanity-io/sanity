import fs from 'node:fs'
import path from 'node:path'

import {MONOREPO_ROOT} from './constants'
import {getPackageJsonPaths} from './monorepoPackages'
import {type PackageInfo} from './types'

export function readPackages(): PackageInfo[] {
  return getPackageJsonPaths().map((packageJSONPath) => {
    const absolutePath = path.join(MONOREPO_ROOT, packageJSONPath)
    const dirname = path.dirname(absolutePath)
    return {
      path: absolutePath,
      dirname,
      repoPath: path.relative(MONOREPO_ROOT, absolutePath),
      repoDir: path.relative(MONOREPO_ROOT, dirname),
      contents: JSON.parse(fs.readFileSync(absolutePath, 'utf8')),
    }
  })
}

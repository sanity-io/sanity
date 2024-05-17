/* eslint-disable no-sync */
import fs from 'node:fs'
import path from 'node:path'

import {type Package} from '../types'
import {getManifestPaths} from './getPackagePaths'

const rootPath = path.join(__dirname, '..', '..')

export default function readPackages(): Package[] {
  return getManifestPaths().map((file) => {
    const filePath = path.join(rootPath, file)
    const dirname = path.join(rootPath, path.dirname(file))
    return {
      path: filePath,
      dirname: dirname,
      relativeDir: path.relative(rootPath, dirname),
      manifest: JSON.parse(fs.readFileSync(filePath, 'utf8')),
    }
  })
}

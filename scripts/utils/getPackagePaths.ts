/* eslint-disable no-sync */
import path from 'path'
import glob from 'glob'
import config from '../../lerna.json'

const patterns = config.packages.map((pkg) => path.join(pkg, 'package.json'))

export function getManifestPaths() {
  return patterns.flatMap((pattern) => glob.sync(pattern))
}

export function getPackagePaths() {
  return getManifestPaths().map((p) => path.dirname(p))
}

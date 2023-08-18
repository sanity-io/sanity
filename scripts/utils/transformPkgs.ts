/* eslint-disable no-sync */
import fs from 'fs'
import {PackageManifest} from '../types'
import readPackages from './readPackages'

/**
 * @internal
 */
export default function transformPkgs(
  mapFn: (pkg: PackageManifest, options: {relativeDir: string}) => PackageManifest,
): void {
  readPackages().forEach((pkg) => {
    const {manifest, relativeDir} = pkg
    const result = mapFn(manifest, {relativeDir})
    fs.writeFileSync(pkg.path, `${JSON.stringify(result, null, 2)}\n`)
  })
}

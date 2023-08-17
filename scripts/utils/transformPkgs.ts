/* eslint-disable no-sync */
import fs from 'fs'
import {PackageManifest} from '../types'
import readPackages from './readPackages'

export default function transformPkgs(mapFn: (pkg: PackageManifest) => PackageManifest) {
  readPackages().forEach((pkg) => {
    const result = mapFn(pkg.manifest)
    fs.writeFileSync(pkg.path, `${JSON.stringify(result, null, 2)}\n`)
  })
}

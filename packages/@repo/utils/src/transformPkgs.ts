import fs from 'node:fs'

import {readPackages} from './readPackages'
import {type PackageJSON} from './types'

/**
 * @internal
 */
export function transformPkgs(
  mapFn: (pkg: PackageJSON, options: {relativeDir: string}) => PackageJSON,
): void {
  readPackages().forEach((pkg) => {
    const {contents, relativeDir} = pkg
    const result = mapFn(contents, {relativeDir})
    fs.writeFileSync(pkg.path, `${JSON.stringify(result, null, 2)}\n`)
  })
}

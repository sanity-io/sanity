import {readEnv} from '@repo/utils'

import {corePkgs} from '../constants'
import {createStorageClient} from '../helpers/createStorageClient'
import {updateManifestWith} from '../helpers/updateManifestWith'
import {
  deprecateVersion as deprecateManifestVersion,
  undeprecateVersion as undeprecateManifestVersion,
} from '../operations/deprecateVersion'
import {type KnownEnvVar, type ManifestPackage} from '../types'
import {cleanDirName, currentUnixTime} from '../utils'

const storage = createStorageClient()

const bucket = storage.bucket(readEnv<KnownEnvVar>('GCLOUD_BUCKET'))

async function updateCorePackages(
  update: (existingPackage: ManifestPackage) => ManifestPackage,
): Promise<void> {
  await updateManifestWith(bucket, (existingManifest) => {
    const existingPackages = existingManifest?.packages || {}
    const updatedPackages = Object.fromEntries(
      corePkgs.map((rawPkgName) => {
        const pkgName = cleanDirName(rawPkgName)
        const existingPackage = existingPackages[pkgName]
        if (!existingPackage) {
          throw new Error(`Cannot update non-existing package "${pkgName}"`)
        }
        return [pkgName, update(existingPackage)]
      }),
    )

    return {
      updatedAt: new Date().toISOString(),
      packages: {
        ...existingPackages,
        ...updatedPackages,
      },
    }
  })
}

/**
 * Marks a version of the core packages as deprecated in the module manifest.
 * The version stays in `versions` and the bundles stay in the bucket.
 */
export async function deprecateVersion(args: {version: string; reason?: string}) {
  const {version, reason} = args

  console.log(
    `Deprecating version ${version} of the following packages: ${corePkgs.join(', ')}${
      reason ? ` (reason: ${reason})` : ''
    }`,
  )

  const timestamp = currentUnixTime()
  await updateCorePackages((existingPackage) =>
    deprecateManifestVersion(existingPackage, {version, timestamp, reason}),
  )
  console.log(`Done ✅`)
}

/**
 * Removes a deprecation notice for a version of the core packages again.
 */
export async function undeprecateVersion(args: {version: string}) {
  const {version} = args

  console.log(
    `Removing deprecation of version ${version} for the following packages: ${corePkgs.join(', ')}`,
  )

  await updateCorePackages((existingPackage) =>
    undeprecateManifestVersion(existingPackage, version),
  )
  console.log(`Done ✅`)
}

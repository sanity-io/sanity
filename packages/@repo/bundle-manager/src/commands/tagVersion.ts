import {Storage} from '@google-cloud/storage'
import {readEnv} from '@repo/utils'

import {isValidTag} from '../assert'
import {corePkgs, validTags} from '../constants'
import {updateManifestWith} from '../helpers/updateManifestWith'
import {tagVersion as tagManifestVersion} from '../operations/tagVersion'
import {type KnownEnvVar} from '../types'
import {cleanDirName} from '../utils'

const storage = new Storage({
  projectId: readEnv<KnownEnvVar>('GOOGLE_PROJECT_ID'),
  credentials: JSON.parse(readEnv<KnownEnvVar>('GCLOUD_SERVICE_KEY')),
})

const bucket = storage.bucket(readEnv<KnownEnvVar>('GCLOUD_BUCKET'))

export async function tagVersion(args: {tag: string; version: string}) {
  const {tag, version} = args

  if (!isValidTag(tag)) {
    throw new Error(`Unsupported tag, must be one of [${validTags.join(', ')}] required options`)
  }

  console.log(`Tagging the following packages as "${tag}": ${corePkgs.join(', ')}`)

  await updateManifestWith(bucket, (existingManifest) => {
    // Set the tag for each package
    const existingPackages = existingManifest?.packages || {}
    const updatedPackages = Object.fromEntries(
      corePkgs.map((rawPkgName) => {
        const pkgName = cleanDirName(rawPkgName)
        const existingPackage = existingPackages[pkgName]
        if (!existingPackage) {
          throw new Error('Cannot tag non-existing package')
        }
        return [pkgName, tagManifestVersion(existingPackage, tag, version)]
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
  console.log(`Done ✅`)
}

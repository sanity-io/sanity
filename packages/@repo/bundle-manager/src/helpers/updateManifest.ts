import {type Bucket} from '@google-cloud/storage'
import {uniqBy} from 'lodash'
import semver from 'semver'

import {type DistTag, type Manifest, type ManifestPackage} from '../types'
import {cleanDirName} from '../utils'

export async function updateManifest(options: {
  bucket: Bucket
  tag: DistTag
  newVersions: Map<string, string>
}) {
  const {bucket, tag, newVersions} = options
  let existingManifest: Manifest | undefined

  // note: look into enabling versioning on the bucket
  let generation: string | number | undefined

  const file = bucket.file('modules/v1/manifest-v1.json')

  try {
    // Step 1: Get current generation of the object
    const [metadata] = await file.getMetadata()
    generation = metadata.generation

    existingManifest = JSON.parse((await file.download()).toString())
  } catch (error) {
    console.log('Could not download or parse existing manifest', error)
  }

  const timestamp = Math.floor(Date.now() / 1000)

  // Add the new version to the manifest with timestamp
  const updatedPackages = Array.from(newVersions).reduce(
    (acc, [key, version]): Record<string, ManifestPackage> => {
      const dirName = cleanDirName(key)
      return {
        ...acc,
        [dirName]: {
          ...acc[dirName],
          default: version,
          tags: {
            latest: acc[dirName]?.tags?.latest || [],
            next: acc[dirName]?.tags?.next || [],
            stable: acc[dirName]?.tags?.stable || [],
            [tag]: uniqBy(
              [{version: version, timestamp}, ...(acc[dirName]?.tags?.[tag] || [])]
                // NOTE: important that we sort by timestamp since unique-ing will keep the first entry.
                // We want to keep the version with the oldest timestamp, and we don't want duplicates
                .toSorted((a, b) => a.timestamp - b.timestamp),
              'version',
            )
              // in the end, we want the list to be sorted by oldest versions first
              // todo: verify if this is needed.
              .toSorted((a, b) => semver.compare(a.version, b.version)),
          },
          versions: uniqBy(
            [{version: version, timestamp}, ...(acc[dirName]?.versions || [])],
            'version',
          ).toSorted((a, b) => semver.compare(a.version, b.version)),
        } satisfies ManifestPackage,
      }
    },
    existingManifest?.packages || {},
  )

  const updatedManifest: Manifest = {
    updatedAt: new Date().toISOString(),
    packages: updatedPackages,
  }
  console.log(JSON.stringify(updatedManifest, null, 2))

  try {
    await file.save(JSON.stringify(updatedManifest), {
      preconditionOpts: {ifGenerationMatch: generation},
      contentType: 'application/json',
      metadata: {
        // no-cache to help with consistency across pods when this manifest
        // is downloaded in the module-server
        cacheControl: 'no-cache, max-age=0',
      },
    })
  } catch (error) {
    throw new Error('Error copying manifest file', {cause: error})
  }
}

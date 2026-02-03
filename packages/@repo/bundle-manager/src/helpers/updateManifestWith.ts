import {type Bucket} from '@google-cloud/storage'

import {type Manifest} from '../types'

export async function updateManifestWith(
  bucket: Bucket,
  updater: (manifest: Manifest | undefined) => Manifest | undefined,
) {
  // note: look into enabling versioning on the bucket
  const file = bucket.file('modules/v1/manifest-v1.json')

  let generation: string | number | undefined
  let existingManifest: Manifest | undefined
  try {
    const [metadata] = await file.getMetadata()
    generation = metadata.generation

    existingManifest = JSON.parse((await file.download()).toString())
  } catch (error) {
    console.log('Could not download or parse existing manifest', error)
  }

  const updatedManifest = updater(existingManifest)
  if (!updatedManifest) {
    return
  }

  try {
    await file.save(JSON.stringify(updatedManifest), {
      preconditionOpts: {
        // Note: Object Versioning needs to be enabled on the bucket for this to work
        ifGenerationMatch: generation,
      },
      contentType: 'application/json',
      metadata: {
        // no-cache to help with consistency across pods when this manifest
        // is downloaded in the module-server
        cacheControl: 'no-cache, max-age=0',
      },
    })
  } catch (error) {
    throw new Error('Error updating manifest file', {cause: error})
  }
}

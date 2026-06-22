import {readEnv} from '@repo/utils'

import {createStorageClient} from '../helpers/createStorageClient'
import {updateManifestWith} from '../helpers/updateManifestWith'
import {type KnownEnvVar} from '../types'

const storage = createStorageClient()

const bucket = storage.bucket(readEnv<KnownEnvVar>('GCLOUD_BUCKET'))

/**
 * verify write access to bucket
 */
export async function verify() {
  await updateManifestWith(bucket, (existingManifest) => existingManifest)
  console.log(`All OK ✅`)
}

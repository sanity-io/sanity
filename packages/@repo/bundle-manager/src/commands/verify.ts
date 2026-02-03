import {Storage} from '@google-cloud/storage'
import {readEnv} from '@repo/utils'

import {updateManifestWith} from '../helpers/updateManifestWith'
import {type KnownEnvVar} from '../types'

const storage = new Storage({
  projectId: readEnv<KnownEnvVar>('GOOGLE_PROJECT_ID'),
  credentials: JSON.parse(readEnv<KnownEnvVar>('GCLOUD_SERVICE_KEY')),
})

const bucket = storage.bucket(readEnv<KnownEnvVar>('GCLOUD_BUCKET'))

/**
 * verify write access to bucket
 */
export async function verify() {
  await updateManifestWith(bucket, (existingManifest) => existingManifest)
  console.log(`All OK ✅`)
}

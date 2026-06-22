import {Storage} from '@google-cloud/storage'
import {readEnv} from '@repo/utils'

import {type KnownEnvVar} from '../types'

/**
 * Creates the GCS `Storage` client used to publish bundles, configured from the
 * standard `GOOGLE_PROJECT_ID`, `GCLOUD_SERVICE_KEY` and `GCLOUD_BUCKET`
 * environment variables.
 *
 * The auth transporter (gaxios) is told to make its requests with the runtime's
 * global `fetch` (undici) instead of its default `node-fetch@2`. Node 24.17.0's
 * fix for CVE-2026-48931 added a public `'data'` listener to idle keep-alive
 * agent sockets, which trips `node-fetch@2`'s `fixResponseChunkedTransferBadEnding`
 * false-positive and surfaces as `ERR_STREAM_PREMATURE_CLOSE` when fetching
 * OAuth tokens from googleapis.com. Routing through undici takes the buggy
 * `node-fetch@2` detector out of the path entirely (rather than just avoiding
 * the socket reuse that triggers it), so it is robust to future Node changes.
 * gaxios itself \(retries, interceptors, error handling\) is unchanged.
 *
 * @see https://github.com/nodejs/node/issues/63989
 */
export function createStorageClient(): Storage {
  return new Storage({
    projectId: readEnv<KnownEnvVar>('GOOGLE_PROJECT_ID'),
    credentials: JSON.parse(readEnv<KnownEnvVar>('GCLOUD_SERVICE_KEY')),
    clientOptions: {transporterOptions: {fetchImplementation: globalThis.fetch}},
  })
}

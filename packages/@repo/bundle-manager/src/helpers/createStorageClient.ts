import {Agent} from 'node:https'

import {Storage} from '@google-cloud/storage'
import {readEnv} from '@repo/utils'

import {type KnownEnvVar} from '../types'

/**
 * Creates the GCS `Storage` client used to publish bundles, configured from the
 * standard `GOOGLE_PROJECT_ID`, `GCLOUD_SERVICE_KEY` and `GCLOUD_BUCKET`
 * environment variables.
 *
 * The auth transporter (gaxios → `node-fetch@2`) is given an agent with
 * keep-alive disabled. Node 24.17.0's fix for CVE-2026-48931 added a public
 * `'data'` listener to idle keep-alive agent sockets; when such a socket is
 * reused, `node-fetch@2`'s `fixResponseChunkedTransferBadEnding` heuristic
 * misreads that listener as an unfinished body and throws a false
 * `ERR_STREAM_PREMATURE_CLOSE` while fetching OAuth tokens from googleapis.com.
 * Using a fresh socket per request avoids the reuse that triggers the bug.
 *
 * Note: we deliberately do not swap `gaxios`'s `fetchImplementation` to the
 * global `fetch` (undici) here. Doing so fixes the token fetch but breaks
 * `@google-cloud/storage`'s resumable upload, which passes an `abort-controller`
 * polyfill signal that undici rejects ("Expected signal to be an instance of
 * AbortSignal"). Keeping `node-fetch@2` and just disabling socket reuse avoids
 * both bugs.
 *
 * @see https://github.com/nodejs/node/issues/63989
 */
export function createStorageClient(): Storage {
  return new Storage({
    projectId: readEnv<KnownEnvVar>('GOOGLE_PROJECT_ID'),
    credentials: JSON.parse(readEnv<KnownEnvVar>('GCLOUD_SERVICE_KEY')),
    clientOptions: {transporterOptions: {agent: new Agent({keepAlive: false})}},
  })
}

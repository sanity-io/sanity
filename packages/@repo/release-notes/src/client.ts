import {readEnv} from '@repo/utils'
import {type SanityClient, createClient} from '@sanity/client'

import {type KnownEnvVar} from './types'

let _client: SanityClient | undefined

export function getClient(): SanityClient {
  if (!_client) {
    _client = createClient({
      projectId: readEnv<KnownEnvVar>('RELEASE_NOTES_SANITY_PROJECT_ID'),
      dataset: readEnv<KnownEnvVar>('RELEASE_NOTES_SANITY_DATASET'),
      token: readEnv<KnownEnvVar>('RELEASE_NOTES_SANITY_TOKEN'),
      apiVersion: '2025-09-16',
      useCdn: false,
    })
  }
  return _client
}

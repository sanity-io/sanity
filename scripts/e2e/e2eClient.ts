import {type SanityClient, createClient} from '@sanity/client'
import {sanityIdify} from '../utils/sanityIdify'
import {readEnv} from '../utils/envVars'

export type KnownEnvVar =
  | 'SANITY_E2E_DATASET'
  | 'SANITY_E2E_PROJECT_ID'
  | 'SANITY_E2E_SESSION_TOKEN'

export function createE2EClient(dataset: string): SanityClient {
  return createClient({
    projectId: readEnv<KnownEnvVar>('SANITY_E2E_PROJECT_ID'),
    dataset: sanityIdify(dataset),
    token: readEnv<KnownEnvVar>('SANITY_E2E_SESSION_TOKEN'),
    apiVersion: '2023-02-03',
    useCdn: false,
  })
}

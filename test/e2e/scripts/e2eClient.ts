import {createClient, type SanityClient} from '@sanity/client'

import {readEnv} from '../envVars'

export function createE2EClient(dataset: string): SanityClient {
  return createClient({
    projectId: readEnv('SANITY_E2E_PROJECT_ID'),
    token: readEnv('SANITY_E2E_SESSION_TOKEN'),
    dataset: dataset,
    apiVersion: '2025-05-22',
    useCdn: false,
    apiHost: 'https://api.sanity.work',
  })
}

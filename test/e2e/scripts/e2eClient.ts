import {createClient, type SanityClient} from '@sanity/client'

import {SANITY_E2E_PROJECT_ID, SANITY_E2E_SESSION_TOKEN} from '../env'

export function createE2EClient(dataset: string): SanityClient {
  return createClient({
    projectId: SANITY_E2E_PROJECT_ID,
    token: SANITY_E2E_SESSION_TOKEN,
    dataset: dataset,
    apiVersion: '2025-05-22',
    useCdn: false,
    apiHost: 'https://api.sanity.work',
  })
}

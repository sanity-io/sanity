import {sanityIdify, readEnv} from '@repo/utils'
import {createClient, type SanityClient} from '@sanity/client'

export function createE2EClient(dataset: string): SanityClient {
  return createClient({
    projectId: readEnv('SANITY_E2E_PROJECT_ID'),
    dataset: sanityIdify(dataset),
    token: readEnv('SANITY_E2E_SESSION_TOKEN'),
    apiVersion: '2023-02-03',
    useCdn: false,
    apiHost: 'https://api.sanity.work',
  })
}

import {readEnv, sanityIdify} from '@repo/utils'
import {createClient, type SanityClient} from '@sanity/client'

export type KnownEnvVar = 'DOCS_REPORT_DATASET' | 'DOCS_REPORT_TOKEN'

export function createDocClient(dataset: string): SanityClient {
  return createClient({
    projectId: 'c1zuxvqn',
    dataset: sanityIdify(dataset),
    token: readEnv<KnownEnvVar>('DOCS_REPORT_TOKEN'),
    apiVersion: '2023-02-03',
    useCdn: false,
  })
}

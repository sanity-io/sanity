import {type SanityClient, createClient} from '@sanity/client'
import {sanityIdify} from '../utils/sanityIdify'
import {readEnv} from '../utils/envVars'

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

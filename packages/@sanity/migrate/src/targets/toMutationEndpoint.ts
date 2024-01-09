import {type Mutation, SanityEncoder} from '@bjoerge/mutiny'
import {toFetchOptions} from '../fetch-utils/sanityRequestOptions'
import {endpoints} from '../fetch-utils/endpoints'
import {fetchAsyncIterator} from '../fetch-utils/fetchStream'
import {parseJSON} from '../it-utils/json'
import {decode} from '../it-utils/decode'

interface APIOptions {
  projectId: string
  apiVersion: `vX` | `v${number}-${number}-${number}`
  token: string
  dataset: string
  apiHost?: string
}

export async function* toMutationEndpoint(
  options: APIOptions,
  mutations: AsyncIterableIterator<Mutation[] | Mutation>,
) {
  for await (const mutation of mutations) {
    const fetchOptions = toFetchOptions({
      projectId: options.projectId,
      apiVersion: options.apiVersion,
      token: options.token,
      apiHost: options.apiHost ?? 'api.sanity.io',
      endpoint: endpoints.data.mutate(options.dataset),
      body: JSON.stringify({
        mutations: SanityEncoder.encode(Array.isArray(mutation) ? mutation : [mutation]),
      }),
    })
    yield parseJSON(decode(await fetchAsyncIterator(fetchOptions)))
  }
}

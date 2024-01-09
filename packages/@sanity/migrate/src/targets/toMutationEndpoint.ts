import {type Mutation, SanityEncoder} from '@bjoerge/mutiny'
import {MultipleMutationResult} from '@sanity/client'
import {toFetchOptions} from '../fetch-utils/sanityRequestOptions'
import {endpoints} from '../fetch-utils/endpoints'
import {fetchAsyncIterator} from '../fetch-utils/fetchStream'
import {parseJSON} from '../it-utils/json'
import {decodeText} from '../it-utils/decodeText'
import {concatStr} from '../it-utils/concatStr'

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
      endpoint: endpoints.data.mutate(options.dataset, {returnIds: true}),
      body: JSON.stringify({
        mutations: SanityEncoder.encode(Array.isArray(mutation) ? mutation : [mutation]),
      }),
    })

    for await (const result of parseJSON(
      concatStr(decodeText(await fetchAsyncIterator(fetchOptions))),
    )) {
      // todo: add return type
      yield result as MultipleMutationResult
    }
  }
}

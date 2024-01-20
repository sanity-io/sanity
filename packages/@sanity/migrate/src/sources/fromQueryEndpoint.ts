import {endpoints} from '../fetch-utils/endpoints'
import {fetchAsyncIterator} from '../fetch-utils/fetchStream'
import {toFetchOptions} from '../fetch-utils/sanityRequestOptions'
import {type APIConfig} from '../types'

export function fromQueryEndpoint(options: APIConfig) {
  return fetchAsyncIterator(
    toFetchOptions({
      projectId: options.projectId,
      apiVersion: options.apiVersion,
      token: options.token,
      apiHost: options.apiHost ?? 'api.sanity.io',
      endpoint: endpoints.data.query(options.dataset),
    }),
  )
}

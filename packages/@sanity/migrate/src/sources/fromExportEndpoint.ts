import {createSafeJsonParser} from '@sanity/util/createSafeJsonParser'
import {fetchAsyncIterator} from '../fetch-utils/fetchStream'
import {toFetchOptions} from '../fetch-utils/sanityRequestOptions'
import {endpoints} from '../fetch-utils/endpoints'
import {APIConfig} from '../types'
import {SanityDocument} from '@sanity/types'

export function fromExportEndpoint(options: APIConfig) {
  return fetchAsyncIterator(
    toFetchOptions({
      projectId: options.projectId,
      apiVersion: options.apiVersion,
      token: options.token,
      apiHost: options.apiHost ?? 'api.sanity.io',
      endpoint: endpoints.data.export(options.dataset),
    }),
  )
}

/**
 * Safe JSON parser that is able to handle lines interrupted by an error object.
 *
 * This may occur when streaming NDJSON from the Export HTTP API.
 *
 * @internal
 * @see {@link https://github.com/sanity-io/sanity/pull/1787 | Initial pull request}
 */
export const safeJsonParser = createSafeJsonParser<SanityDocument>({
  errorLabel: 'Error streaming dataset',
})

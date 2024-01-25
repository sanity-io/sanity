import {createSafeJsonParser} from '@sanity/util/createSafeJsonParser'
import {SanityDocument} from '@sanity/types'
import {fetchAsyncIterator} from '../fetch-utils/fetchStream'
import {toFetchOptions} from '../fetch-utils/sanityRequestOptions'
import {endpoints} from '../fetch-utils/endpoints'
import {ExportAPIConfig} from '../types'

export function fromExportEndpoint(
  options: ExportAPIConfig,
): Promise<AsyncGenerator<Uint8Array, void, unknown>> {
  return fetchAsyncIterator(
    toFetchOptions({
      projectId: options.projectId,
      apiVersion: options.apiVersion,
      token: options.token,
      apiHost: options.apiHost ?? 'api.sanity.io',
      endpoint: endpoints.data.export(options.dataset, options.documentTypes.join(',')),
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

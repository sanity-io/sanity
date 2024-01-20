import {type SanityDocument} from '@sanity/types'
import {createSafeJsonParser} from '@sanity/util/createSafeJsonParser'

import {endpoints} from '../fetch-utils/endpoints'
import {fetchStream} from '../fetch-utils/fetchStream'
import {toFetchOptions} from '../fetch-utils/sanityRequestOptions'
import {type ExportAPIConfig} from '../types'

export function fromExportEndpoint(options: ExportAPIConfig) {
  return fetchStream(
    toFetchOptions({
      projectId: options.projectId,
      apiVersion: options.apiVersion,
      token: options.token,
      apiHost: options.apiHost ?? 'api.sanity.io',
      tag: 'sanity.migration.export',
      endpoint: endpoints.data.export(options.dataset, options.documentTypes),
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

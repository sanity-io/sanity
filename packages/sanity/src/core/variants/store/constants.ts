import {type SourceClientOptions} from '../../config/types'

// api extractor take issues with 'as const' for literals
// oxlint-disable-next-line prefer-as-const
export const VARIANT_DOCUMENT_TYPE: 'system.variant' = 'system.variant'
export const VARIANT_DOCUMENTS_PATH = '_.variants'

/**
 * @internal This is the client options used for the variants studio client, using the `X` API version for now
 * Will change to a specific version soon.
 * TODO: Remove after API version is stable and support variants
 */
export const VARIANTS_STUDIO_CLIENT_OPTIONS: SourceClientOptions = {
  // TBD; using today for now
  apiVersion: 'X',
}

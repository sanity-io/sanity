import {type FieldDefinition} from '@sanity/types'

import {resolveMetadataConfig} from '../metadataConfig'
import {type PluginOptions, type VariantMetadataConfig} from '../types'

/**
 * Resolves `beta.variants.metadata` across plugins and the root config, with the merge rules of
 * `resolveMetadataConfig`. `fields` is always set.
 *
 * Fields named like a core metadata field are kept here: `variantMetadataSchema` drops them
 * when it builds the schema type.
 *
 * @internal
 */
export function resolveVariantMetadataConfig(
  config: PluginOptions,
): VariantMetadataConfig & {fields: FieldDefinition[]} {
  return resolveMetadataConfig(
    config,
    'beta.variants.metadata',
    (inner) => inner.beta?.variants?.metadata,
  )
}

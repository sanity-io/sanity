import {VARIANT_METADATA_TYPE_NAME} from '@sanity/schema/_internal'
import {type ObjectDefinition} from '@sanity/types'

import {extendBuiltinType} from '../../schema/extendBuiltinType'

/**
 * Variant metadata definition without the `name` and `type` that
 * {@link defineVariantMetadata} sets.
 *
 * @beta
 */
export type VariantMetadataDefinition = Omit<ObjectDefinition, 'name' | 'type' | 'fields'> & {
  fields?: ObjectDefinition['fields']
}

/**
 * Defines the `sanity.variantMetadata` schema type, which replaces the default
 * metadata stored on variant definitions.
 *
 * The core fields (`title`, `description` and `type`) are always included, the
 * way `image` always includes its asset fields, so the definition only lists
 * the fields it adds. Passing a field with one of those names throws.
 *
 * @example
 * ```ts
 * defineVariantMetadata({
 *   fields: [
 *     defineField({name: 'owner', type: 'string'}),
 *   ],
 * })
 * ```
 *
 * @beta
 */
export function defineVariantMetadata(
  definition: VariantMetadataDefinition,
): ObjectDefinition & {name: typeof VARIANT_METADATA_TYPE_NAME} {
  return extendBuiltinType(VARIANT_METADATA_TYPE_NAME, definition)
}

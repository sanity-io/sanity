import {RELEASE_METADATA_TYPE_NAME} from '@sanity/schema/_internal'
import {type ObjectDefinition} from '@sanity/types'

/**
 * Release metadata definition without the `name` and `type` that
 * {@link defineReleaseMetadata} sets.
 *
 * @beta
 */
export type ReleaseMetadataDefinition = Omit<ObjectDefinition, 'name' | 'type' | 'fields'> & {
  fields?: ObjectDefinition['fields']
}

/**
 * Defines the `sanity.releaseMetadata` schema type, which replaces the default
 * metadata stored on content releases.
 *
 * The core fields (`title`, `description`, `releaseType`, `intendedPublishAt`
 * and `cardinality`) are always included, the way `image` always includes its
 * asset fields, so the definition only lists the fields it adds. Declaring a
 * field with one of those names is a schema error.
 *
 * @example
 * ```ts
 * defineReleaseMetadata({
 *   fields: [
 *     defineField({name: 'legalReview', type: 'string'}),
 *   ],
 * })
 * ```
 *
 * @beta
 */
export function defineReleaseMetadata(
  definition: ReleaseMetadataDefinition,
): ObjectDefinition & {name: typeof RELEASE_METADATA_TYPE_NAME} {
  return {fields: [], ...definition, name: RELEASE_METADATA_TYPE_NAME, type: 'object'}
}

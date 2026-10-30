import {RELEASE_METADATA_TYPE_NAME} from '@sanity/schema/_internal'
import {type ObjectDefinition} from '@sanity/types'

/**
 * Release metadata definition without the `name` and `type` that
 * {@link defineReleaseMetadata} sets.
 *
 * @beta
 */
export type ReleaseMetadataDefinition = Omit<ObjectDefinition, 'name' | 'type'>

/**
 * Defines the `sanity.releaseMetadata` schema type, which replaces the default
 * metadata stored on content releases.
 *
 * The core fields (`title`, `description`, `releaseType`, `intendedPublishAt`
 * and `cardinality`) are added when they are not declared, so the definition
 * only has to list the fields it adds. A core field can be redeclared to change
 * how it is presented, as long as it still stores a string.
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
  return {...definition, name: RELEASE_METADATA_TYPE_NAME, type: 'object'}
}

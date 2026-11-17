import {type DocumentVersionKind} from '@sanity/types'

interface WithVersions {
  versions?: DocumentVersionKind[]
}

function isVersionKindAllowed(
  schemaType: WithVersions | undefined,
  kind: DocumentVersionKind,
): boolean {
  const versions = schemaType?.versions
  return Array.isArray(versions) ? versions.includes(kind) : true
}

/**
 * Whether documents of the schema type can have versions in releases. This also covers the other
 * version bundles, such as scheduled drafts and agent proposals.
 *
 * @internal
 */
export function isReleaseVersionAllowed(schemaType: WithVersions | undefined): boolean {
  return isVersionKindAllowed(schemaType, 'releases')
}

/**
 * Whether documents of the schema type can have variants.
 *
 * @internal
 */
export function isVariantVersionAllowed(schemaType: WithVersions | undefined): boolean {
  return isVersionKindAllowed(schemaType, 'variants')
}

import {RELEASE_DOCUMENT_TYPE} from '../store/constants'

const NON_VERSIONABLE_DOCUMENT_TYPES: ReadonlySet<string> = new Set([RELEASE_DOCUMENT_TYPE])

/**
 * Whether documents of this type can have release versions or variants. System
 * document types such as releases are only ever edited in place.
 *
 * @internal
 */
export function isVersionableDocumentType(schemaTypeName: string | undefined): boolean {
  return schemaTypeName === undefined || !NON_VERSIONABLE_DOCUMENT_TYPES.has(schemaTypeName)
}

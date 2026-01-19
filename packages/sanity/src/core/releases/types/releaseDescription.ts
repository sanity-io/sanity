import {type EditableReleaseDocument, type ReleaseDocument} from '@sanity/client'
import {type PortableTextBlock} from '@sanity/types'

/**
 * Release description can be either legacy string format or new PTE format.
 * This supports backwards compatibility during migration.
 */
export type ReleaseDescription = string | PortableTextBlock[]

/**
 * Extended release document type that acknowledges both description formats.
 * This is for internal use - the actual DB type remains unchanged.
 */
export type ReleaseDocumentWithPTEDescription = Omit<ReleaseDocument, 'metadata'> & {
  metadata: Omit<ReleaseDocument['metadata'], 'description'> & {
    description?: ReleaseDescription
  }
}

/**
 * Extended editable release document type with PTE description support.
 */
export type EditableReleaseDocumentWithPTEDescription = Omit<
  EditableReleaseDocument,
  'metadata'
> & {
  metadata: Omit<EditableReleaseDocument['metadata'], 'description'> & {
    description?: ReleaseDescription
  }
}

/**
 * Type guard to check if description is in string format (legacy).
 *
 * @param description - The description value to check
 * @returns True if description is a string
 */
export function isStringDescription(
  description: ReleaseDescription | undefined,
): description is string {
  return typeof description === 'string'
}

/**
 * Type guard to check if description is in PTE format.
 *
 * @param description - The description value to check
 * @returns True if description is a PortableTextBlock array
 */
export function isPTEDescription(
  description: ReleaseDescription | undefined,
): description is PortableTextBlock[] {
  return Array.isArray(description)
}

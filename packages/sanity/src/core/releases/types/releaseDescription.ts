import {type PortableTextBlock} from '@sanity/types'

/**
 * Release description can be either legacy string format or new PTE format.
 * This supports backwards compatibility during migration.
 */
export type ReleaseDescription = string | PortableTextBlock[]

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

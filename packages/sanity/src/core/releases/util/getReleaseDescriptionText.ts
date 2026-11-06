import {isPortableTextBlock, toPlainText} from '@portabletext/toolkit'

/**
 * Extracts plain text from a release description that may be either a string
 * or Portable Text blocks.
 *
 * @param description - The description value from release metadata
 * @returns Plain text string, or empty string if the value is not a valid description
 *
 * @internal
 */
export function getReleaseDescriptionText(description: unknown): string {
  if (typeof description === 'string') {
    return description
  }

  if (Array.isArray(description) && description.every(isPortableTextBlock)) {
    return toPlainText(description)
  }

  return ''
}

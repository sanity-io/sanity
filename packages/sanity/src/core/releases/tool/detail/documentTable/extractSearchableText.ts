import {toPlainText} from '@portabletext/react'
import {isPortableTextBlock} from '@portabletext/toolkit'

/**
 * Extracts a searchable string from a field value, handling various data types
 * @param value - The field value to extract text from
 * @returns A string representation suitable for search
 */
export function extractSearchableText(value: unknown): string {
  if (typeof value === 'undefined' || value === null) return ''

  // Handle primitive types
  if (typeof value === 'string') return value
  if (typeof value === 'number') return value.toString()

  // Handle arrays
  if (Array.isArray(value)) {
    // Check if it's portable text
    if (value.length > 0 && isPortableTextBlock(value[0])) {
      return toPlainText(value)
    }
    // Handle regular arrays (join with space)
    return value.map(extractSearchableText).filter(Boolean).join(' ')
  }

  // Handle objects
  if (typeof value === 'object' && value !== null) {
    // Handle localized objects (common pattern: {en: "title", no: "tittel"})
    const entries = Object.entries(value)
    if (
      entries.length > 0 &&
      entries.every(([key, val]) => typeof val === 'string' && !key.startsWith('_'))
    ) {
      // This looks like a localized object, extract all values (excluding metadata keys)
      return entries.map(([, val]) => val).join(' ')
    }

    // Handle objects with specific properties (like {title: "value"})
    if ('title' in value && typeof value.title === 'string') return value.title
    if ('name' in value && typeof value.name === 'string') return value.name
    if ('text' in value && typeof value.text === 'string') return value.text

    // Generic object handling - extract all string/number values
    return Object.entries(value)
      .filter(([key]) => !key.startsWith('_')) // Skip metadata keys
      .map(([, val]) => extractSearchableText(val))
      .filter(Boolean)
      .join(' ')
  }

  return ''
}

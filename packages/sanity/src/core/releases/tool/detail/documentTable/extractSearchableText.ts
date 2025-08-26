import {toPlainText} from '@portabletext/react'
import {isPortableTextBlock} from '@portabletext/toolkit'

/**
 * Extracts a searchable string from a field value, handling various data types
 * @param value - The field value to extract text from
 * @param depth - Current recursion depth
 * @param visited - Array of visited objects thath ave been proceeded so far
 * @returns A string representation suitable for search
 */
export function extractSearchableText(
  value: unknown,
  depth: number = 0,
  visited: Array<unknown> = [],
): string {
  if (typeof value === 'undefined' || value === null) return ''

  // Limit recursion depth to avoid going too deeply into a nested structure
  if (depth > 3) return ''

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
    return value
      .map((item) => extractSearchableText(item, depth + 1, visited))
      .filter(Boolean)
      .join(' ')
  }

  // Handle objects
  if (typeof value === 'object' && value !== null) {
    // Limit the number of items proceeded through the search as to avoid too deep recursion
    // that impacts performance. If the object has already been visited, then there is no need to proceed further.
    if (visited.includes(value)) return ''
    visited.push(value)

    // Handle localized objects (common pattern: {en: "title", no: "tittel"})
    // However, make sure that the values are not internal Sanity keys (starting with _)
    const entries = Object.entries(value)
    if (
      entries.length > 0 &&
      entries.every(([key, val]) => typeof val !== 'boolean' && !key.startsWith('_'))
    ) {
      return entries
        .map(([, val]) => extractSearchableText(val, depth + 1, visited))
        .filter(Boolean)
        .join(' ')
    }

    // Handle objects with specific properties (like {title: "value"})
    if ('title' in value && typeof value.title === 'string') return value.title
    if ('name' in value && typeof value.name === 'string') return value.name
    if ('text' in value && typeof value.text === 'string') return value.text

    // Generic object handling - extract all string/number values
    return entries
      .filter(([key]) => !key.startsWith('_')) // Skip metadata keys
      .map(([, val]) => extractSearchableText(val, depth + 1, visited))
      .filter(Boolean)
      .join(' ')
  }

  return ''
}

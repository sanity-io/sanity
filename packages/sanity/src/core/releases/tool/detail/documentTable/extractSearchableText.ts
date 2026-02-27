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

  // Handle Portable Text
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'object' && item.children && item._type === 'block') {
          return item.children
            .map((child: {text: string}) => child.text)
            .join(' ')
            .trim()
        }
        // If there are nested arrays, then we need to extract the text from the nested arrays
        if (Array.isArray(item)) {
          return extractSearchableText(item, depth + 1, visited)
        }

        // Handle other types (numbers, string)
        return item.toString().trim()
      })
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
    const title =
      'title' in value && typeof value.title === 'string'
        ? value.title.toString().trim()
        : undefined
    const name =
      'name' in value && typeof value.name === 'string' ? value.name.toString().trim() : undefined
    const text =
      'text' in value && typeof value.text === 'string' ? value.text.toString().trim() : undefined

    if (title || name || text) {
      return [title, name, text].filter(Boolean).join(' ')
    }

    // Generic object handling - extract all string/number values
    return entries
      .filter(([key]) => !key.startsWith('_')) // Skip metadata keys
      .map(([, val]) => extractSearchableText(val, depth + 1, visited))
      .filter(Boolean)
      .join(' ')
  }

  return ''
}

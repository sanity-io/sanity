import JSON5 from 'json5'

/**
 * The params as Format writes them: JSON indented by two spaces. `null` when formatting would
 * leave them as they are, or would lose something: params that do not parse, are not an object,
 * or carry comments (JSON has none, so they would be dropped). An object without keys counts as
 * formatted in any spacing, so the empty params a new tab starts with offer no Format.
 */
export function formatParams(rawParams: string): string | null {
  let parsed: unknown
  try {
    parsed = JSON5.parse(rawParams)
  } catch {
    return null
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null
  if (Object.keys(parsed).length === 0 || hasComment(rawParams)) return null
  const formatted = JSON.stringify(parsed, null, 2)
  return formatted === rawParams ? null : formatted
}

/** Whether JSON5 text has a `//` or `/*` comment outside its strings */
function hasComment(text: string): boolean {
  let quote: string | null = null
  for (let index = 0; index < text.length; index++) {
    const char = text[index]
    if (quote) {
      if (char === '\\') index++
      else if (char === quote) quote = null
    } else if (char === '"' || char === "'") {
      quote = char
    } else if (char === '/' && (text[index + 1] === '/' || text[index + 1] === '*')) {
      return true
    }
  }
  return false
}

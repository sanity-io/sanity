const MAX_TITLE_LENGTH = 32
const TYPE_FILTER = /_type\s*==\s*(["'])([^"']+)\1/
const TYPE_IN_FILTER = /_type\s+in\s+\[([^\]]+)\]/
const ID_FILTER = /_id\s*==\s*(["'])([^"']+)\1/

/**
 * Derives a short tab title from a GROQ query: the filtered document type or id when there is one
 * (`*[_type == "author"]` becomes `author`), otherwise the first non-empty line, truncated.
 */
export function deriveTabTitle(query: string): string | undefined {
  const trimmed = query.trim()
  if (!trimmed) {
    return undefined
  }

  const typeMatch = trimmed.match(TYPE_FILTER)
  if (typeMatch) {
    return truncate(typeMatch[2])
  }

  const idMatch = trimmed.match(ID_FILTER)
  if (idMatch) {
    return truncate(idMatch[2])
  }

  const typeInMatch = trimmed.match(TYPE_IN_FILTER)
  if (typeInMatch) {
    const types = typeInMatch[1]
      .split(',')
      .map((type) => type.trim().replace(/^["']|["']$/g, ''))
      .filter(Boolean)
    if (types.length > 0) {
      return truncate(types.join(', '))
    }
  }

  const firstLine = trimmed
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0 && !line.startsWith('//'))

  return truncate(firstLine || trimmed)
}

function truncate(value: string): string {
  const collapsed = value.replace(/\s+/g, ' ')
  return collapsed.length > MAX_TITLE_LENGTH
    ? `${collapsed.slice(0, MAX_TITLE_LENGTH - 1)}…`
    : collapsed
}

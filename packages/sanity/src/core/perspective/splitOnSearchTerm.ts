/** @internal */
export interface SearchTermSegment {
  text: string
  isMatch: boolean
}

/**
 * Splits a string into the runs that match a search term and the runs that do not, in order.
 *
 * Used to mark where a filter term appears inside a release title, so the row shows why it is in
 * the results. Case-insensitive, and every occurrence is marked rather than only the first: a title
 * can contain the term twice, and marking one of them would read as the other not matching.
 *
 * Returns a single non-matching segment when the term is empty or absent, so a caller can render
 * the result the same way whether or not a filter is active.
 *
 * @internal
 */
export function splitOnSearchTerm(text: string, searchTerm: string): SearchTermSegment[] {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase()

  if (!normalizedSearchTerm || !text) return [{text, isMatch: false}]

  const haystack = text.toLowerCase()
  const segments: SearchTermSegment[] = []
  let cursor = 0

  while (cursor < text.length) {
    const matchIndex = haystack.indexOf(normalizedSearchTerm, cursor)

    if (matchIndex === -1) {
      segments.push({text: text.slice(cursor), isMatch: false})
      break
    }

    if (matchIndex > cursor) {
      segments.push({text: text.slice(cursor, matchIndex), isMatch: false})
    }

    // Sliced out of the original rather than the lowercased copy, so the row keeps the title's own
    // capitalisation.
    segments.push({
      text: text.slice(matchIndex, matchIndex + normalizedSearchTerm.length),
      isMatch: true,
    })

    cursor = matchIndex + normalizedSearchTerm.length
  }

  return segments
}

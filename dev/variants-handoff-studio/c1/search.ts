/** What a menu option is found by: its title, the condition it names (`audience: students`), its ID. */
export interface SearchFields {
  title: string
  condition?: string
  id?: string
}

/** The open beta's menu search shows from this many options up (OPEN-BETA-HANDOFF-SCOPE: "more than 3"). */
export const SEARCH_FROM = 4

/**
 * The menu search rule (T1, T2, T4): titles first, then conditions, then IDs, ranked in that order. An ID matches only whole or from its
 * start, so a stray fragment never lists an option. An option found by its condition or ID says why ("Matches locale: de-DE", "Matches ID").
 */
export function rankSearch<T>(
  items: readonly T[],
  query: string,
  get: (item: T) => SearchFields,
): {item: T; reason?: string}[] {
  const q = query.trim().toLowerCase()
  if (!q) return items.map((item) => ({item}))
  const found: {item: T; reason?: string; score: number}[] = []
  for (const item of items) {
    const {title, condition, id} = get(item)
    const t = title.toLowerCase()
    if (t.startsWith(q)) found.push({item, score: 0})
    else if (t.includes(q)) found.push({item, score: 1})
    else if (condition?.toLowerCase().includes(q))
      found.push({item, score: 2, reason: `Matches ${condition}`})
    else if (id?.toLowerCase().startsWith(q)) found.push({item, score: 3, reason: 'Matches ID'})
  }
  return found.sort((x, y) => x.score - y.score)
}

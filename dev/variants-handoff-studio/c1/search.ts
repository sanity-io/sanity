/** What a menu option is found by: its title, the condition it names, its ID. */
export interface SearchFields {
  title: string
  /** The condition as people read it: the dimension and the value's title (`audience: First-time visitors`), the slug only without a title. */
  condition?: {dimension: string; value: string}
  id?: string
}

/** The open beta's menu search shows from this many options up (OPEN-BETA-HANDOFF-SCOPE: "more than 3"). */
export const SEARCH_FROM = 4

/**
 * The menu search rule (T1, T2, T4): titles first, then conditions, then IDs, ranked in that order. An ID matches only whole or from its
 * start, so a stray fragment never lists an option. An option found by its condition or ID says why ("Matches locale: German", "Matches ID").
 * A query that names the dimension itself ("audience") matches every option of it: only the first of those says why, so the list is not one
 * reason repeated on every row.
 */
export function rankSearch<T>(
  items: readonly T[],
  query: string,
  get: (item: T) => SearchFields,
): {item: T; reason?: string}[] {
  const q = query.trim().toLowerCase()
  if (!q) return items.map((item) => ({item}))
  const found: {item: T; reason?: string; score: number; byDimension?: string}[] = []
  for (const item of items) {
    const {title, condition, id} = get(item)
    const t = title.toLowerCase()
    const said = condition ? `${condition.dimension}: ${condition.value}` : ''
    if (t.startsWith(q)) found.push({item, score: 0})
    else if (t.includes(q)) found.push({item, score: 1})
    else if (condition && said.toLowerCase().includes(q)) {
      const onValue = condition.value.toLowerCase().includes(q)
      found.push({
        item,
        score: 2,
        reason: `Matches ${said}`,
        byDimension: onValue ? undefined : condition.dimension,
      })
    } else if (id?.toLowerCase().startsWith(q)) found.push({item, score: 3, reason: 'Matches ID'})
  }
  found.sort((x, y) => x.score - y.score)
  const named = new Set<string>()
  return found.map(({item, reason, byDimension}) => {
    if (!byDimension) return {item, reason}
    if (named.has(byDimension)) return {item}
    named.add(byDimension)
    return {item, reason: `Matches ${byDimension}`}
  })
}

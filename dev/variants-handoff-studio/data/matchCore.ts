// (Pure part, no React: the C1 state provider uses it too without importing itself.)
// What a chosen perspective (a value per dimension, from the C1 address row) matches. A variant matches when every condition of its definition holds
// in the perspective. It matches FULLY when the definition names exactly the perspective's dimensions, and PARTIALLY when the definition names fewer
// (it is served to a visitor with those values, but another definition could fit them better). One file for the C3 list indicator, option D
// and the C4 editor lens, so the three agree.

export type MatchKind = 'full' | 'partial'

/** Does one definition match the perspective, and how well? `null` when it does not (or when it has no conditions). */
export function matchOf(
  conditions: Record<string, string>,
  chosen: Record<string, string>,
): MatchKind | null {
  const names = Object.keys(conditions)
  if (!names.length) return null
  if (!names.every((name) => chosen[name] === conditions[name])) return null
  return names.length === Object.keys(chosen).length ? 'full' : 'partial'
}

export interface PerspectiveMatch {
  /** A perspective is chosen (at least one value). */
  active: boolean
  chosen: Record<string, string>
  /** How one variant (by its short id) matches; `null` for none. */
  variant: (variantId: string) => MatchKind | null
  /** The best match among some variants: full beats partial. */
  best: (variantIds: Iterable<string>) => MatchKind | null
  /** The matching variants among some, full ones first. */
  matching: (variantIds: Iterable<string>) => {variantId: string; kind: MatchKind}[]
}

export function createPerspectiveMatch(
  chosen: Record<string, string>,
  definitions: readonly {_id: string; conditions: Record<string, string>}[],
): PerspectiveMatch {
  const byId = new Map(definitions.map((d) => [d._id.replace(/^_\.variants\./, ''), d]))
  const variant = (variantId: string) => {
    const definition = byId.get(variantId)
    return definition ? matchOf(definition.conditions, chosen) : null
  }
  const matching = (ids: Iterable<string>) =>
    [...new Set(ids)]
      .flatMap((variantId) => {
        const kind = variant(variantId)
        return kind ? [{variantId, kind}] : []
      })
      .sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'full' ? -1 : 1))
  return {
    active: Object.keys(chosen).length > 0,
    chosen,
    variant,
    best: (ids) => matching(ids)[0]?.kind ?? null,
    matching,
  }
}

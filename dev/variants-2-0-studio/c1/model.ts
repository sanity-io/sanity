// The selector's state shape and helpers, from the Storybook exploration (selector/model.ts @ 2700f4cf07).
// LIVE: the fixture `DIMENSIONS` and `V2World` are gone; dimensions are derived from the dataset's
// `system.variant` definitions (see ./world.ts).
export type Chosen = Record<string, string>

/** A dimension and its values, `[key, title]` each. The key is what a variant's `conditions` uses. */
export interface DimensionSpec {
  name: string
  title: string
  values: readonly (readonly [string, string])[]
}

export interface SystemVariant {
  _id: string
  conditions: Record<string, string>
  priority: number
  metadata?: {title?: string}
}

export function valueTitle(dimension: DimensionSpec, key: string) {
  return dimension.values.find(([k]) => k === key)?.[1] ?? key
}

export const matches = (text: string, query: string) =>
  !query.trim() || text.toLowerCase().includes(query.trim().toLowerCase())

const humanize = (key: string) => key.replace(/[-_]+/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

/** Dimension order: the ones the handoff names first, then the rest alphabetically. */
const ORDER = ['audience', 'locale', 'market', 'channel', 'campaign', 'plan']

/**
 * The dimensions a set of variant definitions uses, with only the values some variant uses. A value's title is the
 * title of the single-condition variant that defines it; a value only seen in composites keeps its key.
 */
export function deriveDimensions(variants: readonly SystemVariant[]): DimensionSpec[] {
  const byName = new Map<string, Map<string, string>>()
  for (const variant of variants) {
    const entries = Object.entries(variant.conditions)
    for (const [name, key] of entries) {
      const values = byName.get(name) ?? new Map<string, string>()
      const single = entries.length === 1 ? variant.metadata?.title : undefined
      if (single || !values.has(key)) values.set(key, single ?? humanize(key))
      byName.set(name, values)
    }
  }
  return [...byName.entries()]
    .sort(([a], [b]) => {
      const [x, y] = [ORDER.indexOf(a), ORDER.indexOf(b)]
      return x === y ? a.localeCompare(b) : (x === -1 ? 99 : x) - (y === -1 ? 99 : y)
    })
    .map(([name, values]) => ({name, title: humanize(name), values: [...values.entries()]}))
}

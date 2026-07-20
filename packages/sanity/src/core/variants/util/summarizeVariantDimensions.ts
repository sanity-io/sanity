import {type SystemVariant} from '../types'
import {getVariantSetReference} from './variantSet'

/** One dimension (condition key) and the values seen for it within a group. */
export interface DimensionSummary {
  key: string
  values: string[]
}

/**
 * A cluster in the dimension map: either a variant set (its members' dimensions
 * merged) or a single standalone variant. FH-116 conceptual prototype — the
 * dimension-first view that answers "what dimensions am I actually playing with?"
 * where the variant-first list cannot.
 */
export interface VariantGroupSummary {
  id: string
  name: string
  kind: 'set' | 'standalone'
  variantCount: number
  dimensions: DimensionSummary[]
  /** A member variant to open when the card is selected (first member for a set). */
  representativeVariantId: string
}

function sortStrings(values: Iterable<string>): string[] {
  return Array.from(values)
    .filter(Boolean)
    .toSorted((a, b) => a.localeCompare(b))
}

function variantTitle(variant: SystemVariant): string {
  const title = variant.metadata?.title
  if (typeof title === 'string' && title.trim()) {
    return title.trim()
  }
  return variant.name?.trim() || 'Untitled variant'
}

function dimensionsFrom(valuesByKey: Map<string, Set<string>>): DimensionSummary[] {
  return sortStrings(valuesByKey.keys()).map((key) => ({
    key,
    values: sortStrings(valuesByKey.get(key) ?? []),
  }))
}

function addConditions(valuesByKey: Map<string, Set<string>>, conditions: Record<string, string>) {
  Object.entries(conditions).forEach(([rawKey, rawValue]) => {
    const key = rawKey.trim()
    const value = rawValue?.trim()
    if (!key || !value) {
      return
    }
    let values = valuesByKey.get(key)
    if (!values) {
      values = new Set<string>()
      valuesByKey.set(key, values)
    }
    values.add(value)
  })
}

/**
 * Cluster variants by their set, merging each set's members into a single
 * key→values summary; standalone variants become their own single-member groups.
 * Sets are listed first (by name), then standalone variants.
 *
 * @internal
 */
export function summarizeVariantDimensions(variants: SystemVariant[]): VariantGroupSummary[] {
  const setGroups = new Map<
    string,
    {name: string; valuesByKey: Map<string, Set<string>>; count: number; representative: string}
  >()
  const standalone: VariantGroupSummary[] = []

  for (const variant of variants) {
    const ref = getVariantSetReference(variant)
    if (ref) {
      const group = setGroups.get(ref.id) ?? {
        name: ref.name,
        valuesByKey: new Map<string, Set<string>>(),
        count: 0,
        representative: variant._id,
      }
      group.count += 1
      addConditions(group.valuesByKey, variant.conditions)
      setGroups.set(ref.id, group)
    } else {
      const valuesByKey = new Map<string, Set<string>>()
      addConditions(valuesByKey, variant.conditions)
      standalone.push({
        id: variant._id,
        name: variantTitle(variant),
        kind: 'standalone',
        variantCount: 1,
        dimensions: dimensionsFrom(valuesByKey),
        representativeVariantId: variant._id,
      })
    }
  }

  const setSummaries: VariantGroupSummary[] = Array.from(setGroups, ([id, group]) => ({
    id,
    name: group.name,
    kind: 'set' as const,
    variantCount: group.count,
    dimensions: dimensionsFrom(group.valuesByKey),
    representativeVariantId: group.representative,
  })).toSorted((a, b) => a.name.localeCompare(b.name))

  standalone.sort((a, b) => a.name.localeCompare(b.name))

  return [...setSummaries, ...standalone]
}

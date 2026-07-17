/**
 * A single dimension of a variant set: one condition key and the list of values it can take.
 * A variant set is the cartesian product of its dimensions, so `market: [uk, us, de]` combined
 * with `segment: [loyal, new]` describes 3 × 2 = 6 variant definitions.
 *
 * @internal
 */
export interface VariantSetDimension {
  key: string
  values: string[]
}

/**
 * Parse a comma-separated value string into a clean, de-duplicated, order-preserving list.
 * Blank entries are dropped and surrounding whitespace trimmed, so `"uk, us, , uk"` becomes
 * `['uk', 'us']`. This is what lets a user paste a whole dimension's values "in one shot".
 *
 * @internal
 */
export function parseVariantSetValues(input: string): string[] {
  const seen = new Set<string>()
  const values: string[] = []

  for (const rawValue of input.split(',')) {
    const value = rawValue.trim()

    if (value && !seen.has(value)) {
      seen.add(value)
      values.push(value)
    }
  }

  return values
}

/**
 * Count the permutations a set of dimensions would generate: the product of each dimension's
 * value count. Dimensions without a key or without any values are ignored, so a half-typed
 * table still previews the combinations from the dimensions that are already complete. Returns
 * 0 when no complete dimension exists.
 *
 * @internal
 */
export function countVariantSetPermutations(dimensions: VariantSetDimension[]): number {
  const completeDimensions = dimensions.filter(
    (dimension) => dimension.key.trim() && dimension.values.length > 0,
  )

  if (completeDimensions.length === 0) {
    return 0
  }

  return completeDimensions.reduce((total, dimension) => total * dimension.values.length, 1)
}

/**
 * Expand a set of dimensions into the full cartesian product of conditions — one plain
 * `{key: value}` object per permutation. Incomplete dimensions (no key, or no values) are
 * ignored, mirroring {@link countVariantSetPermutations}, so this always returns exactly
 * `countVariantSetPermutations(dimensions)` entries. Returns an empty list when no complete
 * dimension exists.
 *
 * @internal
 */
export function generateVariantSetPermutations(
  dimensions: VariantSetDimension[],
): Array<Record<string, string>> {
  const completeDimensions = dimensions.filter(
    (dimension) => dimension.key.trim() && dimension.values.length > 0,
  )

  if (completeDimensions.length === 0) {
    return []
  }

  return completeDimensions.reduce<Array<Record<string, string>>>(
    (permutations, dimension) => {
      const key = dimension.key.trim()

      return permutations.flatMap((permutation) =>
        dimension.values.map((value) => ({...permutation, [key]: value})),
      )
    },
    [{}],
  )
}

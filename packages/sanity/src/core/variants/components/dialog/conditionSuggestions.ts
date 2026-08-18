import {type SystemVariant} from '../../types'

export interface ConditionSuggestionOption {
  value: string
}

/**
 * Precomputed lookup of the condition keys and per-key values used across all
 * existing variants. Building this once (e.g. in a `useMemo` keyed on the
 * variants) keeps per-row option derivation cheap, since it avoids re-scanning
 * every variant on each render/keystroke.
 *
 * @internal
 */
export interface ConditionSuggestionIndex {
  /** Unique condition keys, sorted. */
  keys: string[]
  /** Unique values per condition key, sorted. */
  valuesByKey: Map<string, string[]>
}

function sortValues(values: Iterable<string>): string[] {
  return Array.from(values)
    .filter(Boolean)
    .toSorted((a, b) => a.localeCompare(b))
}

/**
 * @internal
 */
export function buildConditionSuggestionIndex(variants: SystemVariant[]): ConditionSuggestionIndex {
  const keys = new Set<string>()
  const valuesByKey = new Map<string, Set<string>>()

  variants.forEach((variant) => {
    Object.entries(variant.conditions).forEach(([rawKey, rawValue]) => {
      const key = rawKey.trim()

      if (!key) {
        return
      }

      keys.add(key)

      const value = rawValue?.trim()

      if (!value) {
        return
      }

      let values = valuesByKey.get(key)

      if (!values) {
        values = new Set<string>()
        valuesByKey.set(key, values)
      }

      values.add(value)
    })
  })

  return {
    keys: sortValues(keys),
    valuesByKey: new Map(Array.from(valuesByKey, ([key, values]) => [key, sortValues(values)])),
  }
}

/**
 * @internal
 */
export function getConditionKeyOptions(
  index: ConditionSuggestionIndex,
  rows: ReadonlyArray<{key: string}>,
  currentRowIndex: number,
): ConditionSuggestionOption[] {
  const usedKeys = new Set(
    rows
      .filter((_, rowIndex) => rowIndex !== currentRowIndex)
      .map((row) => row.key.trim())
      .filter(Boolean),
  )

  return index.keys.filter((key) => !usedKeys.has(key)).map((value) => ({value}))
}

/**
 * @internal
 */
export function getConditionValueOptions(
  index: ConditionSuggestionIndex,
  conditionKey: string,
): ConditionSuggestionOption[] {
  const key = conditionKey.trim()

  if (!key) {
    return []
  }

  return index.valuesByKey.get(key)?.map((value) => ({value})) ?? []
}

/**
 * @internal
 */
export function filterConditionOption(query: string, option: ConditionSuggestionOption): boolean {
  return option.value.toLowerCase().includes(query.trim().toLowerCase())
}

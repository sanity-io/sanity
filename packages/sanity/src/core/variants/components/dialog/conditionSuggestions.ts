import {type SystemVariant} from '../../types'

export interface ConditionSuggestionOption {
  value: string
}

function toSortedOptions(values: Iterable<string>): ConditionSuggestionOption[] {
  return Array.from(values)
    .filter(Boolean)
    .toSorted((a, b) => a.localeCompare(b))
    .map((value) => ({value}))
}

/**
 * @internal
 */
export function getConditionKeyOptions(
  variants: SystemVariant[],
  rows: ReadonlyArray<{key: string}>,
  currentRowIndex: number,
): ConditionSuggestionOption[] {
  const usedKeys = new Set(
    rows
      .filter((_, index) => index !== currentRowIndex)
      .map((row) => row.key.trim())
      .filter(Boolean),
  )
  const keys = new Set<string>()

  variants.forEach((variant) => {
    Object.keys(variant.conditions).forEach((key) => {
      const trimmedKey = key.trim()

      if (trimmedKey && !usedKeys.has(trimmedKey)) {
        keys.add(trimmedKey)
      }
    })
  })

  return toSortedOptions(keys)
}

/**
 * @internal
 */
export function getConditionValueOptions(
  variants: SystemVariant[],
  conditionKey: string,
): ConditionSuggestionOption[] {
  const key = conditionKey.trim()

  if (!key) {
    return []
  }

  const values = new Set<string>()

  variants.forEach((variant) => {
    const value = variant.conditions[key]?.trim()

    if (value) {
      values.add(value)
    }
  })

  return toSortedOptions(values)
}

/**
 * @internal
 */
export function filterConditionOption(query: string, option: ConditionSuggestionOption): boolean {
  return option.value.toLowerCase().includes(query.trim().toLowerCase())
}

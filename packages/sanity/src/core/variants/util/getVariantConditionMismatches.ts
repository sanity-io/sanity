import {type NormalizedVariantConditionMap} from './normalizeVariantConditions'

/**
 * @internal
 */
export type ConditionMismatch =
  | {key: string; value: string; type: 'unknown-key'}
  | {key: string; value: string; type: 'unknown-value'}

const valuesByKeyCache = new WeakMap<
  readonly NormalizedVariantConditionMap[],
  Map<string, Set<string>>
>()

function getValuesByKey(
  definitions: readonly NormalizedVariantConditionMap[],
): Map<string, Set<string>> {
  const cached = valuesByKeyCache.get(definitions)

  if (cached) {
    return cached
  }

  const valuesByKey = new Map(
    definitions.map((definition) => [
      definition.name,
      new Set(definition.values.map((item) => item.value)),
    ]),
  )
  valuesByKeyCache.set(definitions, valuesByKey)

  return valuesByKey
}

/**
 * Returns stored condition pairs that are not in the configured list.
 * Unused configured keys are allowed. The key-to-values lookup is cached on the definitions
 * array so each overview or menu row only scans its own stored pairs.
 *
 * @internal
 */
export function getVariantConditionMismatches(
  conditions: Record<string, string>,
  definitions: readonly NormalizedVariantConditionMap[],
): ConditionMismatch[] {
  const valuesByKey = getValuesByKey(definitions)
  const mismatches: ConditionMismatch[] = []

  for (const [key, value] of Object.entries(conditions)) {
    const allowedValues = valuesByKey.get(key)

    if (!allowedValues) {
      mismatches.push({key, value, type: 'unknown-key'})
      continue
    }

    if (!allowedValues.has(value)) {
      mismatches.push({key, value, type: 'unknown-value'})
    }
  }

  return mismatches
}

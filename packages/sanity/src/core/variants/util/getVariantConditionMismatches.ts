import {type NormalizedVariantConditionMap} from './normalizeVariantConditions'

/**
 * @internal
 */
export type ConditionMismatch =
  | {key: string; value: string; type: 'unknown-key'}
  | {key: string; value: string; type: 'unknown-value'}

/**
 * Returns stored condition pairs that are not in the configured list.
 * Unused configured keys are allowed.
 *
 * @internal
 */
export function getVariantConditionMismatches(
  conditions: Record<string, string>,
  definitions: readonly NormalizedVariantConditionMap[],
): ConditionMismatch[] {
  const valuesByKey = new Map(
    definitions.map((definition) => [
      definition.name,
      new Set(definition.values.map((item) => item.value)),
    ]),
  )
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

import {isRecord} from '../../util/isRecord'
import {type StoredSystemVariant, type SystemVariant, type VariantCondition} from '../types'

function normalizeConditionsArray(conditions: unknown[]): VariantCondition[] {
  const normalized: VariantCondition[] = []

  for (const item of conditions) {
    if (!isRecord(item) || typeof item.condition !== 'string' || typeof item.value !== 'string') {
      continue
    }

    normalized.push({
      // Legacy-converted entries are keyed by their condition name, so fall back to the same key
      // when an entry arrives without one.
      _key: typeof item._key === 'string' && item._key ? item._key : item.condition,
      condition: item.condition,
      value: item.value,
    })
  }

  return normalized
}

/**
 * Converts a definition from either `conditions` shape Content Lake can return into the array
 * shape the Studio works with, and flags definitions still in the legacy object shape.
 *
 * Legacy entries are keyed by their condition name rather than a random key: the store refetches
 * on every change, and stable keys keep each refetch equal to the previous one.
 *
 * @internal
 */
export function normalizeStoredVariant(variant: StoredSystemVariant): SystemVariant {
  const {conditions} = variant

  if (Array.isArray(conditions)) {
    return {...variant, conditions: normalizeConditionsArray(conditions), needsMigration: false}
  }

  if (isRecord(conditions)) {
    return {
      ...variant,
      conditions: Object.entries(conditions).flatMap(([condition, value]) =>
        typeof value === 'string' ? [{_key: condition, condition, value}] : [],
      ),
      needsMigration: true,
    }
  }

  return {...variant, conditions: [], needsMigration: false}
}

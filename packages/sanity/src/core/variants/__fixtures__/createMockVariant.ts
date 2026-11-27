import {VARIANT_DOCUMENT_TYPE, VARIANT_DOCUMENTS_PATH} from '../store/constants'
import {type SystemVariant, type VariantCondition} from '../types'

/**
 * Builds a `conditions` array from a `condition → value` map, keyed by condition name.
 *
 * @internal
 */
export function createMockConditions(conditions: Record<string, string>): VariantCondition[] {
  return Object.entries(conditions).map(([condition, value]) => ({
    _key: condition,
    condition,
    value,
  }))
}

/**
 * @internal
 */
export function createMockVariant(id: string, priority = 0): SystemVariant {
  return {
    _id: `${VARIANT_DOCUMENTS_PATH}.${id}`,
    _type: VARIANT_DOCUMENT_TYPE,
    _createdAt: `2025-01-0${(priority % 9) + 1}T00:00:00Z`,
    _updatedAt: `2025-01-0${(priority % 9) + 1}T00:00:00Z`,
    _rev: `rev-${id}`,
    conditions: [{_key: 'audience', condition: 'audience', value: id}],
    needsMigration: false,
    priority,
  }
}

import {VARIANT_DOCUMENT_TYPE, VARIANT_DOCUMENTS_PATH} from '../store/constants'
import {type SystemVariant} from '../types'

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
    conditions: {audience: id},
    priority,
  }
}

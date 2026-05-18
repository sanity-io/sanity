import {type SystemVariant} from '../../types'

export function createVariant(id: string, priority = 0): SystemVariant {
  return {
    _id: `_.variants.${id}`,
    _type: 'system.variant',
    _createdAt: `2025-01-0${priority + 1}T00:00:00Z`,
    _updatedAt: `2025-01-0${priority + 1}T00:00:00Z`,
    _rev: `rev-${id}`,
    conditions: {audience: id},
    priority,
  }
}

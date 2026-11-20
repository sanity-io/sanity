import {type EditableSystemVariant, type SystemVariant} from '../types'
import {createVariantId} from './createVariantId'
import {getVariantType} from './variantType'

/**
 * The initial value of the form that duplicates `variant`: a new id, the given title, and a copy
 * of everything else the definition carries (conditions, priority, type, description and any other
 * metadata).
 *
 * The conditions are copied unchanged, so the uniqueness validation blocks creating the duplicate
 * until they differ from the original's.
 *
 * @internal
 */
export function getDuplicatedVariant(variant: SystemVariant, title: string): EditableSystemVariant {
  return {
    _id: createVariantId(),
    _type: variant._type,
    conditions: {...variant.conditions},
    priority: variant.priority,
    metadata: {
      ...variant.metadata,
      title,
      type: getVariantType(variant),
    },
  }
}

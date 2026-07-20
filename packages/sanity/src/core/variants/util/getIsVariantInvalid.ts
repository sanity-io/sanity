import {type EditableSystemVariant} from '../types'
import {getPriorityValidationError} from './priorityValidation'

/**
 * @internal
 */
export function getVariantTitleValue(variant: EditableSystemVariant): string {
  const title = variant.metadata?.title

  return typeof title === 'string' ? title.trim() : ''
}

/**
 * @internal
 */
export function getIsVariantInvalid(variant: EditableSystemVariant): boolean {
  return (
    !getVariantTitleValue(variant) ||
    !getHasValidConditions(variant.conditions) ||
    Boolean(getPriorityValidationError(variant.priority))
  )
}

function getHasValidConditions(conditions: EditableSystemVariant['conditions']): boolean {
  const entries = Object.entries(conditions)

  return entries.length > 0 && entries.every(([key, value]) => Boolean(key.trim() && value.trim()))
}

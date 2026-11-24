import {type EditableSystemVariant} from '../types'

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
  return !getVariantTitleValue(variant) || !getHasValidConditions(variant.conditions)
}

function getHasValidConditions(conditions: EditableSystemVariant['conditions']): boolean {
  return (
    conditions.length > 0 &&
    conditions.every(({condition, value}) => Boolean(condition.trim() && value.trim()))
  )
}

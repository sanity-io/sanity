import {isObject} from '../helpers'
import {type CrossDatasetReferenceValue} from './types'

/** @beta */
export function isCrossDatasetReference(
  reference: unknown,
): reference is CrossDatasetReferenceValue {
  return (
    isObject(reference) &&
    typeof reference._ref === 'string' &&
    typeof reference._dataset === 'string' &&
    typeof reference._projectId === 'string'
  )
}

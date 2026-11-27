import {isObject} from '../helpers'
import {type CrossDatasetReferenceValue} from './types'

/**
 * Checks whether a value is a cross-dataset reference, with string `_ref`, `_dataset` and
 * `_projectId` fields, and narrows it to {@link CrossDatasetReferenceValue}.
 *
 * @public
 */
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

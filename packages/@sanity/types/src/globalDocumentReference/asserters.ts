import {isObject} from '../helpers'
import {type GlobalDocumentReferenceValue} from './types'

/** @beta */
export function isGlobalDocumentReference(
  reference: unknown,
): reference is GlobalDocumentReferenceValue {
  if (!isObject(reference) || typeof reference._ref !== 'string') {
    return false
  }

  return reference._ref.split(':').length === 3
}

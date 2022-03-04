import {isObject} from '../helpers'
import {CrossDatasetReference} from './types'

export function isCrossDatasetReference(reference: unknown): reference is CrossDatasetReference {
  return (
    isObject(reference) &&
    typeof reference._ref === 'string' &&
    typeof reference._dataset === 'string' &&
    typeof reference._projectId === 'string'
  )
}

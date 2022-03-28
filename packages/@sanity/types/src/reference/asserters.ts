import {isObject} from '../helpers'
import type {Reference} from './types'

export function isReference(reference: unknown): reference is Reference {
  return isObject(reference) && typeof reference._ref === 'string'
}

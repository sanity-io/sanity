import {isObject} from '../helpers'
import {isReference} from '../reference'
import {type Image} from './types'

/** @public */
export function isImage(value: unknown): value is Image {
  return isObject(value) && isReference(value.asset) && value.asset._ref.startsWith('image-')
}

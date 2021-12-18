import {isObject} from '../helpers'
import {isReference} from '../reference'
import {Image} from './types'

export function isImage(value: unknown): value is Image {
  return isObject(value) && isReference(value.asset)
}

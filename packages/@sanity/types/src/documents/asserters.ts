import {isObject} from '../helpers'
import type {KeyedObject, SanityDocument, TypedObject} from './types'

export function isSanityDocument(document: unknown): document is SanityDocument {
  return (
    isObject(document) && typeof document._id === 'string' && typeof document._type === 'string'
  )
}

export function isTypedObject(obj: unknown): obj is TypedObject {
  return isObject(obj) && typeof obj._type === 'string'
}

export function isKeyedObject(obj: unknown): obj is KeyedObject {
  return isObject(obj) && typeof obj._key === 'string'
}

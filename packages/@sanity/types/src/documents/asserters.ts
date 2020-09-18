import {KeyedObject, Reference, SanityDocument, TypedObject} from './types'

function isObject(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj)
}

export function isSanityDocument(document: unknown): document is SanityDocument {
  return (
    isObject(document) && typeof document._id === 'string' && typeof document._type === 'string'
  )
}

export function isReference(reference: unknown): reference is Reference {
  return isObject(reference) && typeof reference._ref === 'string'
}

export function isTypedObject(obj: unknown): obj is TypedObject {
  return isObject(obj) && typeof obj._type === 'string'
}

export function isKeyedObject(obj: unknown): obj is KeyedObject {
  return isObject(obj) && typeof obj._key === 'string'
}

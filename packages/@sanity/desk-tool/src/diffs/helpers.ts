import {TypedObject, KeyedObject} from '../panes/documentPane/changesPanel/types'

export function getObjectKey(obj: unknown, fallback: string | number) {
  if (isKeyedObject(obj)) {
    return obj._key || fallback
  }

  return fallback
}

export function isTypedObject(val: unknown): val is TypedObject {
  return typeof val === 'object' && val !== null && typeof (val as TypedObject)._type === 'string'
}

export function isKeyedObject(val: unknown): val is KeyedObject {
  return typeof val === 'object' && val !== null && typeof (val as KeyedObject)._key === 'string'
}

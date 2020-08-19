import {UserColorManager, UserColor} from '@sanity/base/user-color'
import {Annotation} from '@sanity/field/diff'
import {TypedObject, KeyedObject} from '../panes/documentPane/changesPanel/types'

export function getAnnotationColor(
  colorManager: UserColorManager,
  annotation: Annotation
): UserColor {
  if (!annotation) {
    return {
      background: '#fcc',
      text: '#f00',
      // @todo CHANGE BEFORE RELEASING - USING RED TO INDICATE MISSING ANNOTATION
      border: 'red'
    }
  }

  return colorManager.get(annotation.author)
}

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

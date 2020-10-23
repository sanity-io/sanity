import {ObjectKeySorter} from 'react-jason'
import {isObjectSchemaType, isTypedObject, Schema} from '@sanity/types'

const reservedKeys = ['_id', '_type', '_key', '_ref', '_weak', '_rev', '_createdAt', '_updatedAt']

export function sanityKeySort(schema: Schema): ObjectKeySorter {
  let lastParent: Record<string, unknown>
  let lastFieldOrder: string[]

  // Cache field order for hot path
  function getFieldOrder(parent: Record<string, unknown>): string[] | undefined {
    if (lastParent === parent) {
      return lastFieldOrder
    }

    if (!isTypedObject(parent) || !schema.has(parent._type)) {
      return undefined
    }

    const type = schema.get(parent._type)
    if (!isObjectSchemaType(type)) {
      return undefined
    }

    if (!type.fields) {
      return []
    }

    lastParent = parent
    lastFieldOrder = type.fields.map((field) => field.name)
    return lastFieldOrder
  }

  return (keyA: string, keyB: string, parent: Record<string, unknown>): number => {
    const indexA = reservedKeys.indexOf(keyA)
    const indexB = reservedKeys.indexOf(keyB)
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB
    }

    const fieldOrder = getFieldOrder(parent)
    if (!fieldOrder) {
      return keyA.localeCompare(keyB)
    }

    return fieldOrder.indexOf(keyA) - fieldOrder.indexOf(keyB)
  }
}

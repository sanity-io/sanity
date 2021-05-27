import {isEmpty, resolveTypeName} from '@sanity/util/content'

import {
  ArraySchemaType,
  InitialValueParams,
  isArraySchemaType,
  isObjectSchemaType,
  ObjectSchemaType,
  SchemaType,
} from '@sanity/types'

import {randomKey} from '@sanity/util/paths'
import deepAssign from './util/deepAssign'
import {resolveValue} from './util/resolveValue'

export function getItemType(arrayType: ArraySchemaType, item: unknown): SchemaType | undefined {
  const itemTypeName = resolveTypeName(item)

  return itemTypeName === 'object' && arrayType.of.length === 1
    ? arrayType.of[0]
    : arrayType.of.find((memberType) => memberType.name === itemTypeName)
}

const MAX_RECURSION_DEPTH = 10

/**
 * Resolve initial value for the given schema type (recursively)
 *
 * @param type {SchemaType} this is the name of the document
 * @param params {Record<string, unknown>} params is a sanity context object passed to every initial value function
 * @param maxDepth {Record<string, unknown>} maximum recursion depth (default 9)
 */
export function resolveInitialValueForType(
  type: SchemaType,
  params: InitialValueParams = {},
  maxDepth = MAX_RECURSION_DEPTH
) {
  if (maxDepth <= 0) {
    return undefined
  }
  if (isObjectSchemaType(type)) {
    return resolveInitialObjectValue(type, params, maxDepth)
  }
  if (isArraySchemaType(type)) {
    return resolveInitialArrayValue(type, params, maxDepth)
  }
  return resolveValue(type.initialValue, params)
}

async function resolveInitialArrayValue(type, params: InitialValueParams, maxDepth: number) {
  const initialArray = await resolveValue(type.initialValue)
  return Array.isArray(initialArray)
    ? Promise.all(
        initialArray.map(async (initialItem) => {
          const itemType = getItemType(type, initialItem)!
          return isObjectSchemaType(itemType)
            ? {
                ...initialItem,
                ...(await resolveInitialValueForType(itemType, params, maxDepth - 1)),
                _key: randomKey(),
              }
            : initialItem
        })
      )
    : undefined
}
export async function resolveInitialObjectValue(
  type: ObjectSchemaType,
  params: InitialValueParams,
  maxDepth: number
) {
  const initialObject: Record<string, unknown> = {
    ...((await resolveValue(type.initialValue, params)) || {}),
  }

  const fieldValues = {}
  await Promise.all(
    type.fields.map(async (field) => {
      const initialFieldValue = await resolveInitialValueForType(field.type, params, maxDepth - 1)
      if (initialFieldValue !== undefined && initialFieldValue !== null) {
        fieldValues[field.name] = initialFieldValue
      }
    })
  )

  const merged = deepAssign(fieldValues, initialObject)
  if (isEmpty(merged)) {
    return undefined
  }
  if (type.name !== 'object') {
    merged._type = type.name
  }
  return merged
}

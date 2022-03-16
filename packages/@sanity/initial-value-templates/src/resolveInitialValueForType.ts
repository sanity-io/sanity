import {isEmpty, resolveTypeName} from '@sanity/util/content'

import {
  ArraySchemaType,
  // InitialValueParams,
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

const DEFAULT_MAX_RECURSION_DEPTH = 10

/**
 * Resolve initial value for the given schema type (recursively)
 */
export function resolveInitialValueForType<Params extends Record<string, unknown>>(
  /**
   * This is the name of the document.
   */
  type: SchemaType,
  /**
   * Params is a sanity context object passed to every initial value function.
   */
  params: Params,
  /**
   * Maximum recursion depth (default 9).
   */
  maxDepth = DEFAULT_MAX_RECURSION_DEPTH
): Promise<any> {
  if (maxDepth <= 0) {
    return Promise.resolve(undefined)
  }

  if (isObjectSchemaType(type)) {
    return resolveInitialObjectValue(type, params, maxDepth)
  }

  if (isArraySchemaType(type)) {
    return resolveInitialArrayValue(type, params, maxDepth)
  }

  return resolveValue(type.initialValue, params)
}

async function resolveInitialArrayValue<Params extends Record<string, unknown>>(
  type: SchemaType,
  params: Params,
  maxDepth: number
): Promise<any> {
  const initialArray = await resolveValue(type.initialValue)

  if (!Array.isArray(initialArray)) {
    return undefined
  }

  return Promise.all(
    initialArray.map(async (initialItem) => {
      const itemType = getItemType(type as ArraySchemaType, initialItem)!
      return isObjectSchemaType(itemType)
        ? {
            ...initialItem,
            ...(await resolveInitialValueForType(itemType, params, maxDepth - 1)),
            _key: randomKey(),
          }
        : initialItem
    })
  )
}

export async function resolveInitialObjectValue<Params extends Record<string, unknown>>(
  type: ObjectSchemaType,
  params: Params,
  maxDepth: number
): Promise<any> {
  const initialObject: Record<string, unknown> = {
    ...((await resolveValue(type.initialValue, params)) || {}),
  }

  const fieldValues: Record<string, any> = {}
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

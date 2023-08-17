import {
  ArraySchemaType,
  InitialValueProperty,
  InitialValueResolver,
  InitialValueResolverContext,
  isArraySchemaType,
  isObjectSchemaType,
  ObjectSchemaType,
  Schema,
  SchemaType,
} from '@sanity/types'
import {isDeepEmpty, randomKey, resolveTypeName} from '@sanity/util/content'
import {isRecord} from './util/isRecord'
import {Template} from './types'
import {validateInitialObjectValue} from './validate'
import deepAssign from './util/deepAssign'

/** @internal */
export type Serializeable<T> = {
  serialize(): T
}

/** @internal */
export function isBuilder(template: unknown): template is Serializeable<Template> {
  return isRecord(template) && typeof template.serialize === 'function'
}

/** @internal */
// returns the "resolved" value from an initial value property (e.g. type.initialValue)
// eslint-disable-next-line require-await
export async function resolveValue<Params, InitialValue>(
  initialValueOpt: InitialValueProperty<Params, InitialValue>,
  params: Params | undefined,
  context: InitialValueResolverContext,
): Promise<InitialValue | undefined> {
  return typeof initialValueOpt === 'function'
    ? (initialValueOpt as InitialValueResolver<Params, InitialValue>)(params, context)
    : initialValueOpt
}

/** @internal */
export async function resolveInitialValue(
  schema: Schema,
  template: Template,
  params: {[key: string]: any} = {},
  context: InitialValueResolverContext,
): Promise<{[key: string]: any}> {
  // Template builder?
  if (isBuilder(template)) {
    return resolveInitialValue(schema, template.serialize(), params, context)
  }

  const {id, schemaType: schemaTypeName, value} = template
  if (!value) {
    throw new Error(`Template "${id}" has invalid "value" property`)
  }

  let resolvedValue = await resolveValue(value, params, context)

  if (!isRecord(resolvedValue)) {
    throw new Error(
      `Template "${id}" has invalid "value" property - must be a plain object or a resolver function returning a plain object`,
    )
  }

  // Ensure _type is set on empty objects
  if (isRecord(resolvedValue) && !Object.keys(resolvedValue).length) {
    resolvedValue = {_type: schemaTypeName}
  }

  // validate default document initial values
  resolvedValue = validateInitialObjectValue(resolvedValue, template)

  // Get deep initial values from schema types (note: the initial value from template overrides the types)
  const schemaType = schema.get(schemaTypeName)
  if (!schemaType) {
    throw new Error(`Could not find schema type with name "${schemaTypeName}".`)
  }

  const newValue = deepAssign(
    (await resolveInitialValueForType(schemaType, params, DEFAULT_MAX_RECURSION_DEPTH, context)) ||
      {},
    resolvedValue as Record<string, unknown>,
  )

  // revalidate and return new initial values
  // todo: would be better to do validation as part of type resolution
  return validateInitialObjectValue(newValue, template)
}

/** @internal */
export function getItemType(arrayType: ArraySchemaType, item: unknown): SchemaType | undefined {
  const itemTypeName = resolveTypeName(item)

  return itemTypeName === 'object' && arrayType.of.length === 1
    ? arrayType.of[0]
    : arrayType.of.find((memberType) => memberType.name === itemTypeName)
}

/** @internal */
export const DEFAULT_MAX_RECURSION_DEPTH = 10

/**
 * Resolve initial value for the given schema type (recursively)
 *
 * @internal
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
  maxDepth = DEFAULT_MAX_RECURSION_DEPTH,
  context: InitialValueResolverContext,
): Promise<any> {
  if (maxDepth <= 0) {
    return Promise.resolve(undefined)
  }

  if (isObjectSchemaType(type)) {
    return resolveInitialObjectValue(type, params, maxDepth, context)
  }

  if (isArraySchemaType(type)) {
    return resolveInitialArrayValue(type, params, maxDepth, context)
  }

  return resolveValue(type.initialValue, params, context)
}

async function resolveInitialArrayValue<Params extends Record<string, unknown>>(
  type: SchemaType,
  params: Params,
  maxDepth: number,
  context: InitialValueResolverContext,
): Promise<any> {
  const initialArray = await resolveValue(type.initialValue, undefined, context)

  if (!Array.isArray(initialArray)) {
    return undefined
  }

  return Promise.all(
    initialArray.map(async (initialItem) => {
      const itemType = getItemType(type as ArraySchemaType, initialItem)!
      return isObjectSchemaType(itemType)
        ? {
            ...initialItem,
            ...(await resolveInitialValueForType(itemType, params, maxDepth - 1, context)),
            _key: randomKey(),
          }
        : initialItem
    }),
  )
}

/** @internal */
export async function resolveInitialObjectValue<Params extends Record<string, unknown>>(
  type: ObjectSchemaType,
  params: Params,
  maxDepth: number,
  context: InitialValueResolverContext,
): Promise<any> {
  const initialObject: Record<string, unknown> = {
    ...((await resolveValue(type.initialValue, params, context)) || {}),
  }

  const fieldValues: Record<string, any> = {}
  await Promise.all(
    type.fields.map(async (field) => {
      const initialFieldValue = await resolveInitialValueForType(
        field.type,
        params,
        maxDepth - 1,
        context,
      )
      if (initialFieldValue !== undefined && initialFieldValue !== null) {
        fieldValues[field.name] = initialFieldValue
      }
    }),
  )

  const merged = deepAssign(fieldValues, initialObject)

  if (isDeepEmpty(merged)) {
    return undefined
  }

  if (type.name !== 'object') {
    merged._type = type.name
  }

  return merged
}

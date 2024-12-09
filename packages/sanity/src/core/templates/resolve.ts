import {
  type ArraySchemaType,
  type InitialValueProperty,
  type InitialValueResolver,
  type InitialValueResolverContext,
  isArraySchemaType,
  isObjectSchemaType,
  type ObjectSchemaType,
  type Schema,
  type SchemaType,
} from '@sanity/types'
import {isDeepEmpty, randomKey, resolveTypeName} from '@sanity/util/content'

import {type Template} from './types'
import deepAssign from './util/deepAssign'
import {isRecord} from './util/isRecord'
import {validateInitialObjectValue} from './validate'

/** @internal */
export type Serializeable<T> = {
  serialize(): T
}

interface Options {
  useCache?: boolean
}

/** @internal */
export function isBuilder(template: unknown): template is Serializeable<Template> {
  return isRecord(template) && typeof template.serialize === 'function'
}

const cache = new WeakMap<
  InitialValueResolver<unknown, unknown>,
  Record<string, unknown | Promise<unknown>>
>()

/** @internal */
// returns the "resolved" value from an initial value property (e.g. type.initialValue)
// eslint-disable-next-line require-await
export async function resolveValue<Params, InitialValue>(
  initialValueOpt: InitialValueProperty<Params, InitialValue>,
  params: Params | undefined,
  context: InitialValueResolverContext,
  options?: Options,
): Promise<InitialValue | undefined> {
  const useCache = options?.useCache

  if (typeof initialValueOpt === 'function') {
    const cached = cache.get(initialValueOpt as InitialValueResolver<unknown, unknown>)

    const key = JSON.stringify([
      params,
      context.projectId,
      context.dataset,
      context.currentUser?.id,
    ])

    if (useCache && cached?.[key]) {
      return cached[key] as InitialValue | Promise<InitialValue>
    }

    const value = (initialValueOpt as InitialValueResolver<Params, InitialValue>)(params, context)

    if (useCache) {
      cache.set(initialValueOpt as InitialValueResolver<unknown, unknown>, {
        ...cached,
        [key]: value,
      })
    }

    return value
  }

  return initialValueOpt
}

/** @internal */
export async function resolveInitialValue(
  schema: Schema,
  template: Template,
  params: {[key: string]: any} = {},
  context: InitialValueResolverContext,
  options?: Options,
): Promise<{[key: string]: any}> {
  // Template builder?
  if (isBuilder(template)) {
    return resolveInitialValue(schema, template.serialize(), params, context, options)
  }

  const {id, schemaType: schemaTypeName, value} = template
  if (!value) {
    throw new Error(`Template "${id}" has invalid "value" property`)
  }

  let resolvedValue = await resolveValue(value, params, context, options)

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
    (await resolveInitialValueForType(
      schemaType,
      params,
      DEFAULT_MAX_RECURSION_DEPTH,
      context,
      options,
    )) || {},
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

type ResolveInitialValueForType = <TParams extends Record<string, unknown>>(
  /**
   * This is the name of the document.
   */ type: SchemaType,
  /**
   * Params is a sanity context object passed to every initial value function.
   */
  params: TParams,
  /**
   * Maximum recursion depth (default 9).
   */
  maxDepth: number,
  context: InitialValueResolverContext,
  options?: Options,
) => Promise<any>

const memoizeResolveInitialValueForType: (
  fn: ResolveInitialValueForType,
) => ResolveInitialValueForType = (fn) => {
  const resolveInitialValueForTypeCache = new WeakMap<SchemaType, Map<string, Promise<any>>>()

  const stableStringify = (obj: any): string => {
    if (obj !== null && typeof obj === 'object') {
      if (Array.isArray(obj)) {
        return `[${obj.map(stableStringify).join(',')}]`
      }
      const keys = Object.keys(obj).sort()
      return `{${keys
        .map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`)
        .join(',')}}`
    }
    return JSON.stringify(obj)
  }

  const hashParameters = (
    params: Record<string, unknown>,
    context: InitialValueResolverContext,
  ): string => {
    return stableStringify({
      params,
      context: {
        schemaName: context.schema.name,
        projectId: context.projectId,
        dataset: context.dataset,
        currentUser: context.currentUser?.id,
      },
    })
  }

  return async function resolveInitialValueForType(type, params, maxDepth, context, options) {
    if (!options?.useCache) return fn(type, params, maxDepth, context, options)

    let typeCache = resolveInitialValueForTypeCache.get(type)

    if (!typeCache) {
      typeCache = new Map<string, Promise<any>>()
      resolveInitialValueForTypeCache.set(type, typeCache)
    }

    const hash = hashParameters(params, context)

    const cachedResult = typeCache.get(hash)
    if (cachedResult) return cachedResult

    const result = await fn(type, params, maxDepth, context, options)

    // double check after the await
    if (!typeCache.has(hash)) {
      typeCache.set(hash, result)
    }
    return result
  }
}

/**
 * Resolve initial value for the given schema type (recursively)
 *
 * @internal
 */
export const resolveInitialValueForType = memoizeResolveInitialValueForType(
  (type, params, maxDepth = DEFAULT_MAX_RECURSION_DEPTH, context, options): Promise<any> => {
    if (maxDepth <= 0) {
      return Promise.resolve(undefined)
    }

    if (isObjectSchemaType(type)) {
      return resolveInitialObjectValue(type, params, maxDepth, context, options)
    }

    if (isArraySchemaType(type)) {
      return resolveInitialArrayValue(type, params, maxDepth, context, options)
    }

    return resolveValue(type.initialValue, params, context, options)
  },
)

async function resolveInitialArrayValue<Params extends Record<string, unknown>>(
  type: SchemaType,
  params: Params,
  maxDepth: number,
  context: InitialValueResolverContext,
  options?: Options,
): Promise<any> {
  const initialArray = await resolveValue(type.initialValue, undefined, context, options)

  if (!Array.isArray(initialArray)) {
    return undefined
  }

  return Promise.all(
    initialArray.map(async (initialItem) => {
      const itemType = getItemType(type as ArraySchemaType, initialItem)!
      return isObjectSchemaType(itemType)
        ? {
            ...initialItem,
            ...(await resolveInitialValueForType(itemType, params, maxDepth - 1, context, options)),
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
  options?: Options,
): Promise<any> {
  const initialObject: Record<string, unknown> = {
    ...((await resolveValue(type.initialValue, params, context, options)) || {}),
  }

  const fieldValues: Record<string, any> = {}
  await Promise.all(
    type.fields.map(async (field) => {
      const initialFieldValue = await resolveInitialValueForType(
        field.type,
        params,
        maxDepth - 1,
        context,
        options,
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

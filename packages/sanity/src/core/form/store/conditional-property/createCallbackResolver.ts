import {type CurrentUser, isKeyedObject, type Path, type SchemaType} from '@sanity/types'

import {EMPTY_ARRAY} from '../../../util/empty'
import {MAX_FIELD_DEPTH} from '../constants'
import {type StateTree} from '../types/state'
import {getId} from '../utils/getId'
import {getItemType} from '../utils/getItemType'
import {immutableReconcile} from '../utils/immutableReconcile'
import {stableStringify} from '../utils/stableStringify'
import {
  type ConditionalPropertyCallbackContext,
  missingConditionalPropertyGetClient,
  resolveConditionalPropertyState,
} from './resolveConditionalProperty'

type CallbackResolverListener = () => void

interface ConditionalValueCacheEntry {
  isPending: boolean
  value: boolean
}

type ResolvePropertyValue = (
  propertyValue: unknown,
  context: ConditionalPropertyCallbackContext,
  key: string,
  pendingValue: boolean,
) => boolean

interface ResolveCallbackStateOptions {
  property: 'readOnly' | 'hidden'
  value: unknown
  parent: unknown
  document: unknown
  currentUser: Omit<CurrentUser, 'role'> | null
  getClient?: ConditionalPropertyCallbackContext['getClient']
  schemaType: SchemaType
  level: number
  path: Path
  resolvePropertyValue: ResolvePropertyValue
}

function resolveCallbackState({
  value,
  parent,
  document,
  currentUser,
  getClient,
  schemaType,
  level,
  property,
  path,
  resolvePropertyValue,
}: ResolveCallbackStateOptions): StateTree<boolean> | undefined {
  const pendingValue = property === 'hidden'
  const context: ConditionalPropertyCallbackContext = {
    value,
    parent,
    document: document as ConditionalPropertyCallbackContext['document'],
    currentUser,
    path,
    getClient: getClient ?? missingConditionalPropertyGetClient,
  }
  const selfValue = resolvePropertyValue(schemaType[property], context, 'self', pendingValue)

  // we don't have to calculate the children if the current value is true
  // because readOnly and hidden inherit. If the parent is readOnly or hidden
  // then its children are assumed to also be readOnly or hidden respectively.
  if (selfValue || level === MAX_FIELD_DEPTH) {
    return {value: selfValue}
  }

  const children: Record<string, StateTree<boolean>> = {}

  if (schemaType.jsonType === 'object') {
    // note: this is needed because not all object types gets a ´fieldsets´ property during schema parsing.
    // ideally members should be normalized as part of the schema parsing and not here
    const normalizedSchemaMembers: typeof schemaType.fieldsets = schemaType.fieldsets
      ? schemaType.fieldsets
      : schemaType.fields.map((field) => ({single: true, field}))

    for (const fieldset of normalizedSchemaMembers) {
      if (fieldset.single) {
        const childResult = resolveCallbackState({
          currentUser,
          document,
          getClient,
          parent: value,
          value: (value as any)?.[fieldset.field.name],
          schemaType: fieldset.field.type,
          level: level + 1,
          property,
          path: [...path, fieldset.field.name],
          resolvePropertyValue,
        })
        if (!childResult) continue

        children[fieldset.field.name] = childResult
        continue
      }

      const fieldsetValue = resolvePropertyValue(
        fieldset.hidden,
        context,
        `fieldset:${fieldset.name}`,
        true,
      )
      if (fieldsetValue) {
        children[`fieldset:${fieldset.name}`] = {
          value: fieldsetValue,
        }
      }

      for (const field of fieldset.fields) {
        const childResult = resolveCallbackState({
          currentUser,
          document,
          getClient,
          parent: value,
          value: (value as any)?.[field.name],
          schemaType: field.type,
          level: level + 1,
          property,
          path: [...path, field.name],
          resolvePropertyValue,
        })
        if (!childResult) continue

        children[field.name] = childResult
      }
    }

    for (const group of schemaType.groups ?? EMPTY_ARRAY) {
      // should only be true for `'hidden'`
      if (property in group) {
        const groupResult = resolvePropertyValue(
          group[property as 'hidden'],
          context,
          `group:${group.name}`,
          pendingValue,
        )
        if (!groupResult) continue

        children[`group:${group.name}`] = {value: groupResult}
      }
    }
  }

  if (schemaType.jsonType === 'array' && Array.isArray(value)) {
    if (value.every(isKeyedObject)) {
      for (const item of value) {
        const itemType = getItemType(schemaType, item)
        if (!itemType) continue

        const childResult = resolveCallbackState({
          currentUser,
          document,
          getClient,
          level: level + 1,
          value: item,
          parent: value,
          schemaType: itemType,
          property,
          path: [...path, {_key: item._key}],
          resolvePropertyValue,
        })
        if (!childResult) continue

        children[item._key] = childResult
      }
    }
  }

  if (Object.keys(children).length) return {children}
  return undefined
}

export interface CreateCallbackResolverOptions<TProperty extends 'hidden' | 'readOnly'> {
  property: TProperty
}

export type ResolveRootCallbackStateOptions<TProperty extends 'hidden' | 'readOnly'> = {
  documentValue: unknown
  currentUser: Omit<CurrentUser, 'role'> | null
  getClient?: ConditionalPropertyCallbackContext['getClient']
  schemaType: SchemaType
} & {[K in TProperty]?: boolean}

export type RootCallbackResolver<TProperty extends 'hidden' | 'readOnly'> = (
  options: ResolveRootCallbackStateOptions<TProperty>,
) => StateTree<boolean> | undefined

export interface RootCallbackResolverWithSubscribe<
  TProperty extends 'hidden' | 'readOnly',
> extends RootCallbackResolver<TProperty> {
  subscribe: (listener: CallbackResolverListener) => () => void
  getVersion: () => number
}

export function createCallbackResolver<TProperty extends 'hidden' | 'readOnly'>({
  property,
}: CreateCallbackResolverOptions<TProperty>): RootCallbackResolverWithSubscribe<TProperty> {
  const stableTrue = {value: true}
  let last: {serializedHash: string; result: StateTree<boolean> | undefined} | null = null
  let activeRootHash: string | null = null
  let activeCache = new Map<string, ConditionalValueCacheEntry>()
  const listeners = new Set<CallbackResolverListener>()
  let version = 0

  const notifyListeners = () => {
    last = null
    version += 1
    for (const listener of listeners) {
      listener()
    }
  }

  const subscribe = (listener: CallbackResolverListener) => {
    listeners.add(listener)

    return () => {
      listeners.delete(listener)
    }
  }

  const getVersion = () => version

  function callbackResult({
    currentUser,
    documentValue,
    getClient,
    schemaType,
    ...options
  }: ResolveRootCallbackStateOptions<TProperty>) {
    const hash = {
      currentUser: currentUser?.id ?? null,
      schemaType: getId(schemaType),
      document: stableStringify(documentValue),
    }
    const serializedHash = JSON.stringify(hash)

    if (activeRootHash !== serializedHash) {
      activeRootHash = serializedHash
      activeCache = new Map<string, ConditionalValueCacheEntry>()
      last = null
    }

    if (property in options) {
      if (options[property] === true) {
        return stableTrue
      }
    }

    if (last?.serializedHash === serializedHash) return last.result

    const resolvePropertyValue: ResolvePropertyValue = (
      propertyValue,
      context,
      key,
      pendingValue,
    ) => {
      const cacheKey = JSON.stringify([context.path, key])
      const cachedValue = activeCache.get(cacheKey)

      if (cachedValue) {
        return cachedValue.value
      }

      const state = resolveConditionalPropertyState(propertyValue as any, context, {
        checkPropertyName: property,
        pendingValue,
      })

      activeCache.set(cacheKey, {
        isPending: state.isPending,
        value: state.value,
      })

      if (state.isPending && state.promise) {
        const rootHashForResolution = serializedHash

        void state.promise.then((resolvedValue) => {
          if (activeRootHash !== rootHashForResolution) {
            return
          }

          activeCache.set(cacheKey, {
            isPending: false,
            value: resolvedValue,
          })
          notifyListeners()
        })
      }

      return state.value
    }

    const result = immutableReconcile(
      last?.result ?? null,
      resolveCallbackState({
        currentUser,
        document: documentValue,
        getClient,
        level: 0,
        parent: null,
        schemaType,
        value: documentValue,
        property,
        path: [],
        resolvePropertyValue,
      }),
    )

    last = {
      result,
      serializedHash,
    }

    return result
  }

  callbackResult.subscribe = subscribe
  callbackResult.getVersion = getVersion

  return callbackResult
}

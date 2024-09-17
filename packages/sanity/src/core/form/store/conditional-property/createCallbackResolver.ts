import {type CurrentUser, isKeyedObject, type SchemaType} from '@sanity/types'

import {EMPTY_ARRAY} from '../../../util/empty'
import {MAX_FIELD_DEPTH} from '../constants'
import {type StateTree} from '../types/state'
import {getId} from '../utils/getId'
import {getItemType} from '../utils/getItemType'
import {immutableReconcile} from '../utils/immutableReconcile'
import {
  type ConditionalPropertyCallbackContext,
  resolveConditionalProperty,
} from './resolveConditionalProperty'

interface ResolveCallbackStateOptions {
  property: 'readOnly' | 'hidden'
  value: unknown
  parent: unknown
  document: unknown
  currentUser: Omit<CurrentUser, 'role'> | null
  schemaType: SchemaType
  level: number
}

function resolveCallbackState({
  value,
  parent,
  document,
  currentUser,
  schemaType,
  level,
  property,
}: ResolveCallbackStateOptions): StateTree<boolean> | undefined {
  const context: ConditionalPropertyCallbackContext = {
    value,
    parent,
    document: document as ConditionalPropertyCallbackContext['document'],
    currentUser,
  }
  const selfValue = resolveConditionalProperty(schemaType[property], context)

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
          parent: value,
          value: (value as any)?.[fieldset.field.name],
          schemaType: fieldset.field.type,
          level: level + 1,
          property,
        })
        if (!childResult) continue

        children[fieldset.field.name] = childResult
        continue
      }

      const fieldsetValue = resolveConditionalProperty(fieldset.hidden, context)
      if (fieldsetValue) {
        children[`fieldset:${fieldset.name}`] = {
          value: fieldsetValue,
        }
      }

      for (const field of fieldset.fields) {
        const childResult = resolveCallbackState({
          currentUser,
          document,
          parent: value,
          value: (value as any)?.[field.name],
          schemaType: field.type,
          level: level + 1,
          property,
        })
        if (!childResult) continue

        children[field.name] = childResult
      }
    }

    for (const group of schemaType.groups ?? EMPTY_ARRAY) {
      // should only be true for `'hidden'`
      if (property in group) {
        const groupResult = resolveConditionalProperty(group[property as 'hidden'], context)
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
          level: level + 1,
          value: item,
          parent: value,
          schemaType: itemType,
          property,
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
  schemaType: SchemaType
} & {[K in TProperty]?: boolean}

export type RootCallbackResolver<TProperty extends 'hidden' | 'readOnly'> = (
  options: ResolveRootCallbackStateOptions<TProperty>,
) => StateTree<boolean> | undefined

export function createCallbackResolver<TProperty extends 'hidden' | 'readOnly'>({
  property,
}: CreateCallbackResolverOptions<TProperty>): RootCallbackResolver<TProperty> {
  const stableTrue = {value: true}
  let last: {serializedHash: string; result: StateTree<boolean> | undefined} | null = null

  function callbackResult({
    currentUser,
    documentValue,
    schemaType,
    ...options
  }: ResolveRootCallbackStateOptions<TProperty>) {
    const hash = {
      currentUser: getId(currentUser),
      schemaType: getId(schemaType),
      document: getId(documentValue),
    }
    const serializedHash = JSON.stringify(hash)

    if (property in options) {
      if (options[property] === true) {
        return stableTrue
      }
    }

    if (last?.serializedHash === serializedHash) return last.result

    const result = immutableReconcile(
      last?.result ?? null,
      resolveCallbackState({
        currentUser,
        document: documentValue,
        level: 0,
        parent: null,
        schemaType,
        value: documentValue,
        property,
      }),
    )

    last = {
      result,
      serializedHash,
    }

    return result
  }

  return callbackResult
}

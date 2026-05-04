import {type CurrentUser, isKeyedObject, type Path, type SchemaType} from '@sanity/types'

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

/**
 * Per-`(schemaType, property)` summary used to decide whether the recursive
 * walk in `resolveCallbackState` can be skipped. The walk is skipped only
 * when `!hasCallback && nestingDepth < MAX_FIELD_DEPTH`; any other case falls
 * through to the original walk so observable behaviour is preserved.
 */
interface SchemaSummary {
  hasCallback: boolean
  /** Capped at `MAX_FIELD_DEPTH`. Cyclic types always reach the cap. */
  nestingDepth: number
}

const SCHEMA_SUMMARY_CACHE: WeakMap<
  SchemaType,
  {hidden?: SchemaSummary; readOnly?: SchemaSummary}
> = new WeakMap()

const CYCLIC_SUMMARY: SchemaSummary = {hasCallback: false, nestingDepth: MAX_FIELD_DEPTH}

function isPossiblyTruthy(value: unknown): boolean {
  return typeof value === 'function' || value === true
}

function summarizeSchema(
  schemaType: SchemaType,
  property: 'hidden' | 'readOnly',
  seen: WeakSet<SchemaType> = new WeakSet(),
): SchemaSummary {
  // Cycle break: re-entering a type up the call stack means any direct
  // callback on it has already been checked in the original visit. We report
  // `nestingDepth: MAX_FIELD_DEPTH` so cyclic schemas always run the original
  // walk (which is itself bounded by `MAX_FIELD_DEPTH`).
  if (seen.has(schemaType)) return CYCLIC_SUMMARY

  let entry = SCHEMA_SUMMARY_CACHE.get(schemaType)
  const cached = entry?.[property]
  if (cached) return cached

  if (isPossiblyTruthy(schemaType[property])) {
    const summary: SchemaSummary = {hasCallback: true, nestingDepth: 0}
    if (!entry) {
      entry = {}
      SCHEMA_SUMMARY_CACHE.set(schemaType, entry)
    }
    entry[property] = summary
    return summary
  }

  seen.add(schemaType)
  const summary = computeSummary(schemaType, property, seen)

  if (!entry) {
    entry = {}
    SCHEMA_SUMMARY_CACHE.set(schemaType, entry)
  }
  entry[property] = summary
  return summary
}

function computeSummary(
  schemaType: SchemaType,
  property: 'hidden' | 'readOnly',
  seen: WeakSet<SchemaType>,
): SchemaSummary {
  let hasCallback = false
  let maxChildNestingDepth = -1

  const visit = (child: SchemaSummary) => {
    if (child.hasCallback) hasCallback = true
    if (child.nestingDepth > maxChildNestingDepth) maxChildNestingDepth = child.nestingDepth
  }

  if (schemaType.jsonType === 'object') {
    const fieldsets = schemaType.fieldsets
      ? schemaType.fieldsets
      : schemaType.fields.map((field) => ({single: true as const, field}))

    for (const fieldset of fieldsets) {
      if (fieldset.single) {
        visit(summarizeSchema(fieldset.field.type, property, seen))
        continue
      }
      if (isPossiblyTruthy(fieldset.hidden)) hasCallback = true
      for (const field of fieldset.fields) {
        visit(summarizeSchema(field.type, property, seen))
      }
    }

    for (const group of schemaType.groups ?? EMPTY_ARRAY) {
      // Mirrors the original `resolveCallbackState`: groups today only declare
      // `hidden`, never `readOnly`, but we defer to the runtime shape so that
      // a future schema-API extension is picked up automatically.
      if (property in group && isPossiblyTruthy(group[property as 'hidden'])) {
        hasCallback = true
      }
    }
  } else if (schemaType.jsonType === 'array') {
    for (const item of schemaType.of ?? EMPTY_ARRAY) {
      visit(summarizeSchema(item, property, seen))
    }
  }
  // Leaf types contribute no recursion: `maxChildNestingDepth` stays at -1
  // and the resulting summary has `nestingDepth: 0`.

  return {
    hasCallback,
    nestingDepth: Math.min(maxChildNestingDepth + 1, MAX_FIELD_DEPTH),
  }
}

interface ResolveCallbackStateOptions {
  property: 'readOnly' | 'hidden'
  value: unknown
  parent: unknown
  document: unknown
  currentUser: Omit<CurrentUser, 'role'> | null
  schemaType: SchemaType
  level: number
  path: Path
}

function resolveCallbackState({
  value,
  parent,
  document,
  currentUser,
  schemaType,
  level,
  property,
  path,
}: ResolveCallbackStateOptions): StateTree<boolean> | undefined {
  const context: ConditionalPropertyCallbackContext = {
    value,
    parent,
    document: document as ConditionalPropertyCallbackContext['document'],
    currentUser,
    path,
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
          path: [...path, fieldset.field.name],
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
          path: [...path, field.name],
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
          path: [...path, {_key: item._key}],
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

    // Module-scoped short-circuit: when the schema has no `hidden`/`readOnly`
    // callbacks anywhere AND doesn't reach `MAX_FIELD_DEPTH`, the recursive
    // walk below would always produce `undefined`, so skip it. Schemas that
    // do reach the depth limit fall through to the original walk so the
    // depth-boundary marker tree is preserved verbatim.
    const summary = summarizeSchema(schemaType, property)
    if (!summary.hasCallback && summary.nestingDepth < MAX_FIELD_DEPTH) {
      last = {serializedHash, result: undefined}
      return undefined
    }

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
        path: [],
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

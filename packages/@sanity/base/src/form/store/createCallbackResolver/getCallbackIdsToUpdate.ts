import {ArraySchemaType, isTypedObject, SchemaType} from '@sanity/types'
import {isObject as _isObject} from 'lodash'
import {CallbackDependencyNode} from './updateDependencyTree'

// Note: not using `utils/isRecord` because that function returns false for arrays
const isObject = _isObject as (value: unknown) => value is Record<string, unknown>
const getCallbackIdFromPath = (path: string[]) => path.join('/')

const resolveArrayMemberType = (schemaType: ArraySchemaType, value: unknown) => {
  const typeName = resolveTypeName(value)
  const declared = schemaType.of.find((candidate) => candidate.name === typeName)
  if (declared) return declared
  return schemaType.of.length === 1 ? schemaType.of[0] : undefined
}

const resolveTypeName = (value: unknown) =>
  isTypedObject(value) ? value._type : resolveJsType(value)

const resolveJsType = (val: unknown) => {
  if (Array.isArray(val)) return 'array'
  if (val === null) return 'null'
  return typeof val
}

function* getCallbackIdsFromDependencyTree({
  callbackIds,
  children,
}: CallbackDependencyNode): Generator<string> {
  if (callbackIds) {
    for (const path of callbackIds) {
      yield path
    }
  }
  if (children) {
    for (const child of Object.values(children)) {
      yield* getCallbackIdsFromDependencyTree(child)
    }
  }
}

function* getCallbackIdsFromSchema(
  schemaType: SchemaType,
  path: string[],
  conditionalPropertyKey: 'hidden' | 'readOnly'
): Generator<string> {
  if (typeof schemaType[conditionalPropertyKey] === 'function') {
    yield getCallbackIdFromPath(path)
  }
  if ('fields' in schemaType) {
    for (const field of schemaType.fields) {
      yield* getCallbackIdsFromSchema(field.type, [...path, field.name], conditionalPropertyKey)
    }
  }
}

interface GetCallbackIdsToUpdateOptions {
  prev: unknown
  curr: unknown
  path: string[]
  dependencies: CallbackDependencyNode
  schemaType: SchemaType
  conditionalPropertyKey: 'hidden' | 'readOnly'
}

/**
 * Diffs a previous and current value while simultaneously traversing the
 * dependency tree nodes that contain the IDs of the callbacks that depend on
 * the value at that path. If a difference is found, the callback IDs at that
 * path will be yielded.
 */
export function* getCallbackIdsToUpdate({
  prev,
  curr,
  path,
  dependencies,
  schemaType,
  conditionalPropertyKey,
}: GetCallbackIdsToUpdateOptions): Generator<string> {
  // if both values are not container values then we can diff them directly and
  // yield any callback IDs in the dependency tree if a difference is found
  if (!isObject(prev) && !isObject(curr)) {
    if (prev === curr) {
      // no-op
    } else {
      if (!dependencies.callbackIds) return
      for (const callbackId of dependencies.callbackIds) {
        yield callbackId
      }
    }
    return
  }

  // if the previous value was a container value and the next value is not a
  // container value (e.g. `{foo: true}` => `null`) then we can recursively
  // yield the callback IDs at the current dependency tree node
  if (isObject(prev) && !isObject(curr)) {
    for (const callbackId of getCallbackIdsFromDependencyTree(dependencies)) {
      yield callbackId
    }
    return
  }

  // if the the previous value was a primitive and the next value is a container
  // value then we have to yield all the current callback IDs at the dependency
  // tree node (should just be shallow though) and also yield a new set of
  // callback IDs derived from the traversing the schema starting from this
  // path
  if (!isObject(prev) && isObject(curr)) {
    for (const callbackId of getCallbackIdsFromDependencyTree(dependencies)) {
      yield callbackId
    }
    for (const callbackId of getCallbackIdsFromSchema(schemaType, path, conditionalPropertyKey)) {
      yield callbackId
    }
    return
  }

  // if both the previous and current values are container values then each
  // subvalue in each container type can be compared. Sets of referentially
  // equal of sub-values (and the callback IDs nested inside the current
  // dependency tree) will be skipped :D
  if (isObject(prev) && isObject(curr)) {
    const keys = new Set([...Object.keys(prev), ...Object.keys(curr)])

    for (const key of keys) {
      const valuePrev = prev[key]
      const valueCurr = curr[key]

      if (valuePrev === valueCurr) {
        // yay big skip
      } else {
        const subDependencies = dependencies.children?.[key]
        const subSchemaType =
          ('of' in schemaType && resolveArrayMemberType(schemaType, valueCurr)) ||
          ('fields' in schemaType && schemaType.fields.find((field) => field.name === key)?.type)

        if (subDependencies && subSchemaType) {
          yield* getCallbackIdsToUpdate({
            prev: valuePrev,
            curr: valueCurr,
            dependencies: subDependencies,
            path: [...path, key],
            schemaType: subSchemaType,
            conditionalPropertyKey,
          })
        }
      }
    }
  }
}

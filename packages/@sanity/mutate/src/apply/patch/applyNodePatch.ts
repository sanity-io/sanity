import {type Operation} from '../../mutations/operations/types'
import {type NodePatch, type NodePatchList} from '../../mutations/types'
import {isArrayElement, isPropertyElement, stringify} from '../../path'
import {isObject} from '../../utils/isObject'
import {type NormalizeReadOnlyArray} from '../../utils/typeUtils'
import {type KeyedPathElement, type Path} from '../'
import {findTargetIndex, splice} from '../utils/array'
import {applyOp} from './applyOp'
import {
  type ApplyAtPath,
  type ApplyNodePatch,
  type ApplyPatches,
} from './typings/applyNodePatch'

export function applyPatches<Patches extends NodePatchList, const Doc>(
  patches: Patches,
  document: Doc,
): ApplyPatches<NormalizeReadOnlyArray<Patches>, Doc> {
  return (patches as NodePatch[]).reduce(
    (prev, patch) => applyNodePatch(patch, prev) as any,
    document,
  ) as any
}

export function applyNodePatch<const Patch extends NodePatch, const Doc>(
  patch: Patch,
  document: Doc,
): ApplyNodePatch<Patch, Doc> {
  return applyAtPath(patch.path, patch.op, document) as any
}

function applyAtPath<P extends Path, O extends Operation, T>(
  path: P,
  op: O,
  value: T,
): ApplyAtPath<P, O, T> {
  if (isEmptyArray(path)) {
    return applyOp(op as any, value) as any
  }

  const [head, ...tail] = path

  if (isArrayElement(head) && Array.isArray(value)) {
    return applyInArray(head, tail, op, value)
  }

  if (isPropertyElement(head) && isObject(value)) {
    return applyInObject(head, tail, op, value) as any
  }

  throw new Error(
    `Cannot apply operation of type "${op.type}" to path ${stringify(
      path,
    )} on ${typeof value} value`,
  )
}

function applyInObject<Key extends keyof any, T extends {[key in Key]?: any}>(
  head: Key,
  tail: Path,
  op: Operation,
  object: T,
) {
  const current = object[head]

  if (current === undefined && tail.length > 0) {
    return object
  }

  // The patch targets the item at the index specified by "head"
  // so forward it to the item
  const patchedValue = applyAtPath(tail, op, current)

  // If the result of applying it to the item yields the item back we assume it was
  // a noop and don't modify our value. If we get a new value back, we return a
  // new array with the modified item replaced
  return patchedValue === current ? object : {...object, [head]: patchedValue}
}

function applyInArray<T>(
  head: number | KeyedPathElement,
  tail: Path,
  op: Operation,
  value: T[],
) {
  const index = findTargetIndex(value, head!)

  if (index === null) {
    // partial is default behavior for arrays
    // the patch targets an index that is out of bounds
    return value
  }

  // If the given selector could not be found, return as-is
  if (index === -1) {
    return value
  }

  const current = value[index]!

  // The patch targets the item at the index specified by "head"
  // so forward it to the item
  const patchedItem = applyAtPath(tail, op, current)

  // If the result of applying it to the item yields the item back we assume it was
  // a noop and don't modify our value. If we get a new value back, we return a
  // new array with the modified item replaced
  return patchedItem === current
    ? current
    : splice(value, index, 1, [patchedItem])
}

function isEmptyArray(a: any[] | readonly any[]): a is [] {
  return a.length === 0
}

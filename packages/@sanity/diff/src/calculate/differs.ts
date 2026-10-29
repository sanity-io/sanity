import {replaceProperty} from '../helpers'
import {
  type ArrayDiff,
  type ArrayInput,
  type BooleanInput,
  type Diff,
  type DiffOptions,
  type Input,
  type ItemDiff,
  type NumberInput,
  type ObjectDiff,
  type ObjectInput,
  type StringInput,
  type TypeChangeDiff,
} from '../types'
import {diffBoolean, diffNumber} from './diffSimple'
import {addedString, diffString, removedString} from './diffString'
import {getLongestCommonSubsequence} from './lcs'

// The type dispatchers (`diffInput`, `addedInput`, `removedInput`) and the container handlers
// (`diffArray`, `diffObject`, `diffTypeChange`) are mutually recursive, so they live in the same
// module to avoid circular imports.

/**
 * Takes a `from` and `to` input and calulates a diff between the two
 *
 * @param fromInput - The source (`from`) input - use {@link wrap | the wrap() method} to generate an "input"
 * @param toInput - The destination (`to`) input - use {@link wrap | the wrap() method} to generate an "input"
 * @param options - Options for the diffing process - currently no options are defined
 * @returns A diff object representing the change
 * @public
 */
export function diffInput<A>(
  fromInput: Input<A>,
  toInput: Input<A>,
  options: DiffOptions = {},
): Diff<A> {
  if (fromInput.type !== toInput.type) {
    if (fromInput.type === 'null') {
      return addedInput(toInput, null, options)
    }

    if (toInput.type === 'null') {
      return removedInput(fromInput, null, options)
    }

    return diffTypeChange(fromInput, toInput, options)
  }

  return diffWithType(fromInput.type, fromInput, toInput, options)
}

function diffWithType<A>(
  type: Input<A>['type'],
  fromInput: Input<A>,
  toInput: Input<A>,
  options: DiffOptions,
): Diff<A> {
  switch (type) {
    case 'null':
      return {
        type: 'null',
        action: 'unchanged',
        isChanged: false,
        toValue: null,
        fromValue: null,
      }
    case 'boolean':
      return diffBoolean(fromInput as BooleanInput<A>, toInput as BooleanInput<A>, options)
    case 'number':
      return diffNumber(fromInput as NumberInput<A>, toInput as NumberInput<A>, options)
    case 'string':
      return diffString(fromInput as StringInput<A>, toInput as StringInput<A>, options)
    case 'array':
      return diffArray(fromInput as ArrayInput<A>, toInput as ArrayInput<A>, options)
    case 'object':
      return diffObject(fromInput as ObjectInput<A>, toInput as ObjectInput<A>, options)
    default:
      // oxlint-disable-next-line restrict-template-expressions - this is a fallback in an edge case scenario, so we can't trust that `type` is truly `never`
      throw new Error(`Unhandled diff type "${type}"`)
  }
}

function removedInput<A>(
  input: Input<A>,
  toValue: null | undefined,
  options: DiffOptions,
): Diff<A> & {action: 'removed'} {
  switch (input.type) {
    case 'null':
      return {
        type: 'null',
        action: 'removed',
        isChanged: true,
        fromValue: null,
        toValue,
        annotation: input.annotation,
      }
    case 'boolean':
      return {
        type: 'boolean',
        action: 'removed',
        isChanged: true,
        fromValue: input.value,
        toValue,
        annotation: input.annotation,
      }
    case 'number':
      return {
        type: 'number',
        action: 'removed',
        isChanged: true,
        fromValue: input.value,
        toValue,
        annotation: input.annotation,
      }
    case 'string':
      return removedString(input, toValue, options)
    case 'array':
      return removedArray(input, toValue, options)
    case 'object':
      return removedObject(input, toValue, options)
    default:
      throw new Error('Unhandled diff type')
  }
}

function addedInput<A>(
  input: Input<A>,
  fromValue: null | undefined,
  options: DiffOptions,
): Diff<A> & {action: 'added'} {
  switch (input.type) {
    case 'null':
      return {
        type: 'null',
        action: 'added',
        isChanged: true,
        fromValue,
        toValue: null,
        annotation: input.annotation,
      }
    case 'boolean':
      return {
        type: 'boolean',
        action: 'added',
        isChanged: true,
        fromValue,
        toValue: input.value,
        annotation: input.annotation,
      }
    case 'number':
      return {
        type: 'number',
        action: 'added',
        isChanged: true,
        fromValue,
        toValue: input.value,
        annotation: input.annotation,
      }
    case 'string':
      return addedString(input, fromValue, options)
    case 'array':
      return addedArray(input, fromValue, options)
    case 'object':
      return addedObject(input, fromValue, options)
    default:
      throw new Error('Unhandled diff type')
  }
}

function diffTypeChange<A>(
  fromInput: Input<A>,
  toInput: Input<A>,
  options: DiffOptions,
): TypeChangeDiff<A> {
  return {
    type: 'typeChange',
    action: 'changed',
    isChanged: true,

    fromType: fromInput.type,
    fromValue: fromInput.value,
    fromDiff: removedInput(fromInput, undefined, options),

    toType: toInput.type,
    toValue: toInput.value,
    toDiff: addedInput(toInput, undefined, options),

    annotation: toInput.annotation,
  }
}

function diffArray<A>(
  fromInput: ArrayInput<A>,
  toInput: ArrayInput<A>,
  options: DiffOptions,
): ArrayDiff<A> {
  if (fromInput === toInput) {
    const fromValue = fromInput.value
    const toValue = toInput.value

    return {
      type: 'array',
      action: 'unchanged',
      isChanged: false,
      fromValue,
      toValue,
      get items(): ItemDiff<A>[] {
        const items = diffExactByPosition(fromInput, toInput, options)
        if (!items) throw new Error('invariant broken: equivalent input, but diff detected')
        return replaceProperty(this, 'items', items)
      },
    }
  }

  // The key-ed approach should handle most cases (_key'ed objects, primitives):
  const keyedA = indexByKey(fromInput)
  const keyedB = indexByKey(toInput)

  if (keyedA && keyedB) {
    return diffArrayByKey(fromInput, keyedA, toInput, keyedB, options)
  }

  // Check if they are 100% equivalent:
  const items = diffExactByPosition(fromInput, toInput, options)
  if (items) return buildArrayDiff(fromInput, toInput, items, false)

  // Otherwise we create a diff where we model it as removing the from-items and adding the to-items.
  return diffArrayByReinsert(fromInput, toInput, options)
}

function buildArrayDiff<A>(
  fromInput: ArrayInput<A>,
  toInput: ArrayInput<A>,
  items: ItemDiff<A>[],
  isChanged: boolean,
): ArrayDiff<A> {
  const fromValue = fromInput.value
  const toValue = toInput.value

  return isChanged
    ? {
        type: 'array',
        action: 'changed',
        isChanged: true,
        fromValue,
        toValue,
        items,
        annotation: toInput.annotation,
      }
    : {
        type: 'array',
        action: 'unchanged',
        isChanged: false,
        fromValue,
        toValue,
        items,
      }
}

/**
 * Diffes the two arrays by position. Returns an `items` array if they are unchanged, or undefined
 * if there are any changes anywhere.
 */
function diffExactByPosition<A>(
  fromInput: ArrayInput<A>,
  toInput: ArrayInput<A>,
  options: DiffOptions,
): ItemDiff<A>[] | undefined {
  if (fromInput.length !== toInput.length) {
    return undefined
  }

  const items: ItemDiff<A>[] = []

  for (let idx = 0; idx < fromInput.length; idx++) {
    const diff = diffInput(fromInput.at(idx), toInput.at(idx), options)
    if (diff.isChanged) {
      return undefined
    }

    items.push({
      fromIndex: idx,
      toIndex: idx,
      hasMoved: false,
      diff,
      annotation: toInput.annotationAt(idx),
    })
  }

  return items
}

function diffArrayByReinsert<A>(
  fromInput: ArrayInput<A>,
  toInput: ArrayInput<A>,
  options: DiffOptions,
): ArrayDiff<A> {
  const items: ItemDiff<A>[] = []

  for (let idx = 0; idx < toInput.length; idx++) {
    const input = toInput.at(idx)

    items.push({
      fromIndex: undefined,
      toIndex: idx,
      hasMoved: false,
      diff: addedInput(input, undefined, options),
      annotation: input.annotation,
    })
  }

  for (let idx = 0; idx < fromInput.length; idx++) {
    const input = fromInput.at(idx)

    items.push({
      fromIndex: idx,
      toIndex: undefined,
      hasMoved: false,
      diff: removedInput(input, undefined, options),
      annotation: input.annotation,
    })
  }

  return buildArrayDiff(fromInput, toInput, items, true)
}

type Key = string | number | boolean

/**
 * Diff an array when all the elements have _key in the same position.
 */
function diffArrayByKey<A>(
  fromArray: ArrayInput<A>,
  fromKeyIndex: KeyIndex,
  toArray: ArrayInput<A>,
  toKeyIndex: KeyIndex,
  options: DiffOptions,
): ArrayDiff<A> {
  const items: ItemDiff<A>[] = []
  let isChanged = false

  function diffCommon(key: Key, fromIndex: number, toIndex: number, hasMoved: boolean) {
    deletePositionInIndex(fromKeyIndex.index, key, fromIndex)
    deletePositionInIndex(toKeyIndex.index, key, toIndex)

    const fromInput = fromArray.at(fromIndex)
    const toInput = toArray.at(toIndex)

    const diff = diffInput(fromInput, toInput, options)
    items.push({
      fromIndex,
      toIndex,
      hasMoved,
      diff,
      annotation: toArray.annotationAt(toIndex),
    })

    if (diff.isChanged || fromIndex !== toIndex) {
      isChanged = true
    }
  }

  const lcs = getLongestCommonSubsequence(fromKeyIndex.keys, toKeyIndex.keys)

  for (let fromIndex = 0; fromIndex < fromKeyIndex.keys.length; fromIndex++) {
    const key = fromKeyIndex.keys[fromIndex]

    const subsequenceIdx = lcs.prevIndices.indexOf(fromIndex)
    if (subsequenceIdx !== -1) {
      // Part of the common subsequence => hasMoved:false
      diffCommon(key, fromIndex, lcs.nextIndices[subsequenceIdx], false)
      continue
    }

    // Not a part of the subsequence. Try to find another item which has the same key
    // and also is not part of the common subsequence.
    const toIndexes = toKeyIndex.index.get(key)
    const toIndex = toIndexes && toIndexes.find((idx) => !lcs.nextIndices.includes(idx))
    if (toIndex !== undefined) {
      diffCommon(key, fromIndex, toIndex, true)
      continue
    }

    const input = fromArray.at(fromIndex)

    items.push({
      fromIndex,
      toIndex: undefined,
      hasMoved: false,
      diff: removedInput(input, undefined, options),
      annotation: fromArray.annotationAt(fromIndex),
    })

    isChanged = true
  }

  // The remaining data in toKeyIndex are the new elements which has been added
  for (const positions of toKeyIndex.index.values()) {
    for (const toIndex of positions) {
      const input = toArray.at(toIndex)
      items.push({
        fromIndex: undefined,
        toIndex,
        hasMoved: false,
        diff: addedInput(input, undefined, options),
        annotation: toArray.annotationAt(toIndex),
      })
    }

    isChanged = true
  }

  items.sort(compareItemDiff)

  return buildArrayDiff(fromArray, toArray, items, isChanged)
}

function compareItemDiff<A>(a: ItemDiff<A>, b: ItemDiff<A>): number {
  if (a.toIndex !== undefined && b.toIndex !== undefined) {
    return a.toIndex - b.toIndex
  }

  if (a.fromIndex !== undefined && b.fromIndex !== undefined) {
    return a.fromIndex - b.fromIndex
  }

  if (a.fromIndex !== undefined && b.toIndex !== undefined) {
    // A was removed and B was added. Prefer to sort removals last.
    return -1
  }

  if (a.toIndex !== undefined && b.fromIndex !== undefined) {
    // A was added and B was removed. Prefer to sort removals last.
    return 1
  }

  throw new Error('invalid item diff comparison')
}

function deletePositionInIndex(index: Map<Key, number[]>, key: Key, pos: number) {
  const positions = index.get(key)!
  deleteArrayValue(positions, pos)
  if (positions.length === 0) {
    index.delete(key)
  }
}

function deleteArrayValue<E>(arr: E[], value: E) {
  const idx = arr.indexOf(value)
  if (idx === -1) throw new Error('value not found')
  arr.splice(idx, 1)
}

type KeyIndex = {
  keys: Key[]
  index: Map<Key, number[]>
}

/**
 * Indexes the array by a key. This handles cases where the items are:
 *
 * - Objects with _key
 * - Strings
 * - Numbers
 */
function indexByKey<A>(arr: ArrayInput<A>): KeyIndex | undefined {
  const index = new Map<Key, number[]>()
  const keys: Key[] = []
  const length = arr.length

  for (let i = 0; i < length; i++) {
    const item = arr.at(i)

    let key: Key | null = null

    switch (item.type) {
      case 'string':
        key = `s${item.value}`
        break
      case 'number':
        key = item.value
        break
      case 'boolean':
        key = item.value
        break
      case 'null':
        key = 'n'
        break
      case 'object':
        {
          const keyField = item.get('_key')
          if (keyField && keyField.type === 'string') {
            key = `k${keyField.value}`

            // We do not handle duplicate _key
            if (index.has(key)) return undefined
          }
        }
        break
      default:
    }

    // No key => abort
    if (key === null) return undefined

    keys.push(key)
    let positions = index.get(key)
    if (!positions) {
      positions = []
      index.set(key, positions)
    }
    positions.push(i)
  }

  // All is good.
  return {keys, index}
}

function removedArray<A>(
  input: ArrayInput<A>,
  toValue: null | undefined,
  options: DiffOptions,
): ArrayDiff<A> & {action: 'removed'} {
  return {
    type: 'array',
    action: 'removed',
    isChanged: true,
    fromValue: input.value,
    toValue,
    annotation: input.annotation,

    get items(): ArrayDiff<A>['items'] {
      const items: ArrayDiff<A>['items'] = []
      for (let i = 0; i < input.length; i++) {
        const item = input.at(i)
        items.push({
          fromIndex: i,
          toIndex: undefined,
          hasMoved: false,
          diff: removedInput(item, undefined, options),
          annotation: input.annotationAt(i),
        })
      }

      return replaceProperty(this, 'items', items)
    },
  }
}

function addedArray<A>(
  input: ArrayInput<A>,
  fromValue: null | undefined,
  options: DiffOptions,
): ArrayDiff<A> & {action: 'added'} {
  return {
    type: 'array',
    action: 'added',
    isChanged: true,
    fromValue,
    toValue: input.value,
    annotation: input.annotation,

    get items(): ArrayDiff<A>['items'] {
      const items: ArrayDiff<A>['items'] = []
      for (let i = 0; i < input.length; i++) {
        const item = input.at(i)
        items.push({
          fromIndex: undefined,
          toIndex: i,
          hasMoved: false,
          diff: addedInput(item, undefined, options),
          annotation: input.annotationAt(i),
        })
      }

      return replaceProperty(this, 'items', items)
    },
  }
}

const ignoredFields = new Set(['_id', '_type', '_createdAt', '_updatedAt', '_rev', '_weak'])

function diffObject<A>(
  fromInput: ObjectInput<A>,
  toInput: ObjectInput<A>,
  options: DiffOptions,
): ObjectDiff<A> {
  const fields: ObjectDiff<A>['fields'] = {}
  let isChanged = false

  for (const key of fromInput.keys) {
    if (ignoredFields.has(key)) continue

    const fromField = fromInput.get(key)!

    const toField = toInput.get(key)
    if (toField) {
      const fieldDiff = diffInput(fromField, toField, options)
      fields[key] = fieldDiff
      if (fieldDiff.isChanged) isChanged = true
    } else {
      fields[key] = removedInput(fromField, undefined, options)
      isChanged = true
    }
  }

  for (const key of toInput.keys) {
    if (ignoredFields.has(key)) continue

    // Already handled above
    if (fromInput.get(key)) continue

    const toField = toInput.get(key)!
    fields[key] = addedInput(toField, undefined, options)
    isChanged = true
  }

  const fromValue = fromInput.value
  const toValue = toInput.value

  if (!isChanged) {
    return {
      type: 'object',
      action: 'unchanged',
      isChanged: false,
      fromValue,
      toValue,
      fields,
    }
  }

  return {
    type: 'object',
    action: 'changed',
    isChanged: true,
    fromValue,
    toValue,
    fields,
    annotation: toInput.annotation,
  }
}

function removedObject<A>(
  input: ObjectInput<A>,
  toValue: null | undefined,
  options: DiffOptions,
): ObjectDiff<A> & {action: 'removed'} {
  return {
    type: 'object',
    action: 'removed',
    isChanged: true,
    fromValue: input.value,
    toValue,
    annotation: input.annotation,

    get fields(): ObjectDiff<A>['fields'] {
      const fields: ObjectDiff<A>['fields'] = {}
      for (const key of input.keys) {
        const value = input.get(key)!
        fields[key] = removedInput(value, undefined, options)
      }
      return replaceProperty(this, 'fields', fields)
    },
  }
}

function addedObject<A>(
  input: ObjectInput<A>,
  fromValue: null | undefined,
  options: DiffOptions,
): ObjectDiff<A> & {action: 'added'} {
  return {
    type: 'object',
    action: 'added',
    isChanged: true,
    fromValue,
    toValue: input.value,
    annotation: input.annotation,

    get fields(): ObjectDiff<A>['fields'] {
      const fields: ObjectDiff<A>['fields'] = {}
      for (const key of input.keys) {
        const value = input.get(key)!
        fields[key] = addedInput(value, undefined, options)
      }
      return replaceProperty(this, 'fields', fields)
    },
  }
}

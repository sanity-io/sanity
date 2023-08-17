import type {ArrayDiff, ArrayInput, ItemDiff, DiffOptions} from '../types'
import {replaceProperty} from '../helpers'
import {diffInput, removedInput, addedInput} from './diffInput'
import {getLongestCommonSubsequence} from './lcs'

export function diffArray<A>(
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

    const diff = diffInput(fromInput, toInput)
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

export function removedArray<A>(
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

export function addedArray<A>(
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

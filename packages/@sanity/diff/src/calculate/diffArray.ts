import {ArrayDiff, ArrayInput, ItemDiff, DiffOptions} from '../types'
import {diffInput, removedInput, addedInput} from './diffInput'
import {getLongestCommonSubsequence} from './lcs'

export function diffArray<A>(
  fromInput: ArrayInput<A>,
  toInput: ArrayInput<A>,
  options: DiffOptions
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
        delete this.items
        const items = diffExactByPosition(fromInput, toInput, options)
        if (!items) throw new Error('invariant broken: equivalent input, but diff detected')
        return (this.items = items)
      }
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
  isChanged: boolean
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
        annotation: toInput.annotation
      }
    : {
        type: 'array',
        action: 'unchanged',
        isChanged: false,
        fromValue,
        toValue,
        items
      }
}

/**
 * Diffes the two arrays by position. Returns an `items` array if they are unchanged, or undefined
 * if there are any changes anywhere.
 */
function diffExactByPosition<A>(
  fromInput: ArrayInput<A>,
  toInput: ArrayInput<A>,
  options: DiffOptions
): ItemDiff<A>[] | undefined {
  if (fromInput.length !== toInput.length) return

  const items: ItemDiff<A>[] = []

  for (let idx = 0; idx < fromInput.length; idx++) {
    let diff = diffInput(fromInput.at(idx), toInput.at(idx), options)
    if (diff.isChanged) return
    items.push({
      fromIndex: idx,
      toIndex: idx,
      hasMoved: false,
      diff
    })
  }

  return items
}

function diffArrayByReinsert<A>(
  fromInput: ArrayInput<A>,
  toInput: ArrayInput<A>,
  options: DiffOptions
): ArrayDiff<A> {
  const items: ItemDiff<A>[] = []

  for (let idx = 0; idx < toInput.length; idx++) {
    let input = toInput.at(idx)

    items.push({
      fromIndex: undefined,
      toIndex: idx,
      hasMoved: false,
      diff: addedInput(input, undefined, options)
    })
  }

  for (let idx = 0; idx < fromInput.length; idx++) {
    let input = fromInput.at(idx)

    items.push({
      fromIndex: idx,
      toIndex: undefined,
      hasMoved: false,
      diff: removedInput(input, undefined, options)
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
  options: DiffOptions
): ArrayDiff<A> {
  const items: ItemDiff<A>[] = []
  let isChanged = false

  function diffCommon(key: Key, fromIndex: number, toIndex: number, hasMoved: boolean) {
    deletePositionInIndex(fromKeyIndex.index, key, fromIndex)
    deletePositionInIndex(toKeyIndex.index, key, toIndex)

    let fromInput = fromArray.at(fromIndex)
    let toInput = toArray.at(toIndex)

    let diff = diffInput(fromInput, toInput)
    items.push({
      fromIndex,
      toIndex,
      hasMoved,
      diff
    })

    if (diff.isChanged || fromIndex !== toIndex) {
      isChanged = true
    }
  }

  let lcs = getLongestCommonSubsequence(fromKeyIndex.keys, toKeyIndex.keys)

  for (let fromIndex = 0; fromIndex < fromKeyIndex.keys.length; fromIndex++) {
    let key = fromKeyIndex.keys[fromIndex]

    let subsequenceIdx = lcs.prevIndices.indexOf(fromIndex)
    if (subsequenceIdx !== -1) {
      // Part of the common subsequence => hasMoved:false
      diffCommon(key, fromIndex, lcs.nextIndices[subsequenceIdx], false)
      continue
    }

    let toIndex = toKeyIndex.index.get(key)?.[0]
    if (toIndex !== undefined) {
      // Not a part of the subsequence, but is present in the to-version => hasMoved:true
      diffCommon(key, fromIndex, toIndex, true)
      continue
    }

    let input = fromArray.at(fromIndex)

    items.push({
      fromIndex,
      toIndex: undefined,
      hasMoved: false,
      diff: removedInput(input, undefined, options)
    })

    isChanged = true
  }

  // The remaining data in toKeyIndex are the new elements which has been added
  for (let positions of toKeyIndex.index.values()) {
    for (let toIndex of positions) {
      let input = toArray.at(toIndex)
      items.push({
        fromIndex: undefined,
        toIndex,
        hasMoved: false,
        diff: addedInput(input, undefined, options)
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
  let positions = index.get(key)!
  deleteArrayValue(positions, pos)
  if (positions.length === 0) {
    index.delete(key)
  }
}

function deleteArrayValue<E>(arr: E[], value: E) {
  let idx = arr.indexOf(value)
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
  let index = new Map<Key, number[]>()
  let keys: Key[] = []
  let length = arr.length

  for (let i = 0; i < length; i++) {
    let item = arr.at(i)

    let key: Key | null = null

    switch (item.type) {
      case 'string':
        key = 's' + item.value
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
      case 'object': {
        const keyField = item.get('_key')
        if (keyField && keyField.type === 'string') {
          key = 'k' + keyField.value

          // We do not handle duplicate _key
          if (index.has(key)) return
        }
      }
    }

    // No key => abort
    if (key === null) return

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
  options: DiffOptions
): ArrayDiff<A> & {action: 'removed'} {
  return {
    type: 'array',
    action: 'removed',
    isChanged: true,
    fromValue: input.value,
    toValue,
    annotation: input.annotation,

    get items(): ArrayDiff<A>['items'] {
      delete this.items
      this.items = []
      for (let i = 0; i < input.length; i++) {
        let item = input.at(i)
        this.items.push({
          fromIndex: i,
          toIndex: undefined,
          hasMoved: false,
          diff: removedInput(item, undefined, options)
        })
      }
      return this.items
    }
  }
}

export function addedArray<A>(
  input: ArrayInput<A>,
  fromValue: null | undefined,
  options: DiffOptions
): ArrayDiff<A> & {action: 'added'} {
  return {
    type: 'array',
    action: 'added',
    isChanged: true,
    fromValue,
    toValue: input.value,
    annotation: input.annotation,

    get items(): ArrayDiff<A>['items'] {
      delete this.items
      this.items = []
      for (let i = 0; i < input.length; i++) {
        let item = input.at(i)
        this.items.push({
          fromIndex: undefined,
          toIndex: i,
          hasMoved: false,
          diff: addedInput(item, undefined, options)
        })
      }
      return this.items
    }
  }
}

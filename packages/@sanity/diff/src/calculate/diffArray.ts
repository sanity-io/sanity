import {ArrayDiff, ArrayInput, Input, ItemDiff, DiffOptions, NoDiff} from '../types'
import {diffInput} from './diffInput'
import {getLongestCommonSubsequence} from './lcs'

export function diffArray<A>(
  fromInput: ArrayInput<A>,
  toInput: ArrayInput<A>,
  options: DiffOptions
): ArrayDiff<A> | NoDiff {
  const fromValue = fromInput.value
  const toValue = toInput.value
  const items = diffArrayItems(fromInput, toInput, options)

  return items
    ? {
        type: 'array',
        isChanged: true,
        fromValue,
        toValue,
        items
      }
    : {
        type: 'unchanged',
        isChanged: false,
        fromValue,
        toValue
      }
}

/** Returns the items array for the diff, or `undefined` if there are no changes. */
function diffArrayItems<A>(
  fromInput: ArrayInput<A>,
  toInput: ArrayInput<A>,
  options: DiffOptions
): ItemDiff<A>[] | undefined {
  if (fromInput === toInput) return

  const keyedA = indexByKey(fromInput)
  const keyedB = indexByKey(toInput)

  return keyedA && keyedB
    ? diffArrayByKey(fromInput, keyedA, toInput, keyedB)
    : diffArrayByReinsert(fromInput, toInput)
}

function diffArrayByReinsert<A>(
  fromInput: ArrayInput<A>,
  toInput: ArrayInput<A>
): ItemDiff<A>[] | undefined {
  const items: ItemDiff<A>[] = []
  let mightBeSame = fromInput.length === toInput.length

  for (let idx = 0; idx < toInput.length; idx++) {
    let input = toInput.at(idx)

    if (mightBeSame) {
      let diff = diffInput(fromInput.at(idx), input)
      if (diff.isChanged) {
        mightBeSame = false
      }
    }

    items.push({
      type: 'added',
      isChanged: true,
      fromIndex: undefined,
      fromValue: undefined,
      toIndex: idx,
      toValue: input.value,
      hasMoved: false,
      annotation: input.annotation
    })
  }

  // If `mightBeSame` is still true, then they are indeed equivalent.
  if (mightBeSame) return

  for (let idx = 0; idx < fromInput.length; idx++) {
    let input = fromInput.at(idx)

    items.push({
      type: 'removed',
      isChanged: true,
      fromIndex: idx,
      fromValue: input.value,
      toIndex: undefined,
      toValue: undefined,
      hasMoved: false,
      annotation: input.annotation
    })
  }

  return items
}

type Key = string | number | boolean

/**
 * Diff an array when all the elements have _key in the same position.
 */
function diffArrayByKey<A>(
  fromArray: ArrayInput<A>,
  fromKeyIndex: KeyIndex,
  toArray: ArrayInput<A>,
  toKeyIndex: KeyIndex
): ItemDiff<A>[] | undefined {
  const items: ItemDiff<A>[] = []
  let isChanged = false

  function diffCommon(key: Key, fromIndex: number, toIndex: number, hasMoved: boolean) {
    deletePositionInIndex(fromKeyIndex.index, key, fromIndex)
    deletePositionInIndex(toKeyIndex.index, key, toIndex)

    let fromInput = fromArray.at(fromIndex)
    let toInput = toArray.at(toIndex)

    let diff = diffInput(fromInput, toInput)
    if (diff.isChanged) {
      items.push({
        type: 'changed',
        isChanged: true,
        fromIndex,
        fromValue: fromInput.value,
        toIndex,
        toValue: toInput.value,
        diff,
        hasMoved
      })
      isChanged = true
    } else {
      items.push({
        type: 'unchanged',
        isChanged: false,
        fromIndex,
        fromValue: fromInput.value,
        toIndex,
        toValue: toInput.value,
        hasMoved
      })

      if (fromIndex !== toIndex) {
        isChanged = true
      }
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

    // Not a part of the to-value => removed
    items.push({
      type: 'removed',
      isChanged: true,
      fromIndex,
      fromValue: input.value,
      toValue: undefined,
      toIndex: undefined,
      hasMoved: false,
      annotation: input.annotation
    })

    isChanged = true
  }

  // The remaining data in toKeyIndex are the new elements which has been added
  for (let positions of toKeyIndex.index.values()) {
    for (let toIndex of positions) {
      let input = toArray.at(toIndex)
      items.push({
        type: 'added',
        isChanged: true,
        fromIndex: undefined,
        fromValue: undefined,
        toIndex,
        toValue: input.value,
        hasMoved: false,
        annotation: input.annotation
      })
    }

    isChanged = true
  }

  if (!isChanged) return

  items.sort(compareItemDiff)

  return items
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
